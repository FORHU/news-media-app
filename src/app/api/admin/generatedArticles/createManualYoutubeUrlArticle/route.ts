import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { stripOriginalPostBlock } from "@/lib/tweetArticleDisplay";
import { sseBroadcaster } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const generationModeSchema = z.enum(["standalone", "commentary"]);

const RequestSchema = z.object({
  topic: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  language: z.string().optional(),
  content: z.string().optional(),
  prompt: z.string().optional(),
  fileContent: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["manual", "youtube"]).optional(),
  generationMode: z.preprocess((val: unknown) => {
    if (val === "commentary_support" || val === "commentary_oppose") return "commentary";
    return val;
  }, generationModeSchema.optional().default("standalone")),
}).refine(data => {
  const hasTopic = data.topic && data.topic.trim().length > 0;
  const hasContent = data.content && data.content.trim().length > 0;
  const hasFileContent = data.fileContent && data.fileContent.trim().length > 0;
  return hasTopic || hasContent || hasFileContent;
}, {
  message: "Insufficient information provided. Please provide a topic, content, or materials."
});

// Safety truncation to avoid token limit errors
function truncateContent(text: string, limit: number = 12000): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Truncated due to length]";
}

// AI persona/instruction
function getAiSystemInstruction(params: {
  isYoutube: boolean;
  youtubeUrl: string;
  generationMode: "standalone" | "commentary";
  requestedLanguage?: string;
}) {
  const { isYoutube, youtubeUrl, generationMode, requestedLanguage } = params;
  const ytRef = (youtubeUrl || "").trim() || "(URL not provided)";

  const languageInstruction = requestedLanguage 
    ? `You MUST write the article in ${requestedLanguage}. 
    
    [CRITICAL TRANSLATION STEP]:
    If you are translating between two non-English languages (e.g., Korean to Japanese, or Korean to Chinese), please follow this internal process:
    1. Mentally translate the key points of the source material into English.
    2. Then, rewrite and generate the final news article ENTIRELY in ${requestedLanguage} based on those English points.
    
    This pivot translation ensures the highest journalistic quality and accuracy. The final output must be 100% ${requestedLanguage}.`
    : `By default, you MUST write the article in the SAME LANGUAGE as the provided [SOURCE MATERIALS] (e.g., if the transcript or content is in Korean, write the article in Korean).`;

  const creditYoutube =
    isYoutube && youtubeUrl
      ? `\nSOURCE CREDITING: You MUST end <content> with exactly one line: "Reference: ${youtubeUrl.trim()}". Separate that line from the last paragraph by exactly two newlines (one blank line).`
      : "";

  let youtubeBlock = "";
  if (isYoutube && generationMode === "standalone") {
    youtubeBlock = `
11. YOUTUBE STANDALONE: The story is based on a transcript from ${ytRef}. Write a standard news article; integrate ideas from the material without pasting the transcript as a block or fenced section.
12. NO ARTIFACT BLOCKS: Do not use "--- ORIGINAL POST ---" or similar delimiters; do not dump long verbatim transcript.`;
  } else if (isYoutube && generationMode === "commentary") {
    youtubeBlock = `
11. YOUTUBE COMMENTARY: Write opinion or analysis grounded in the video’s ideas. Match angle and emphasis to [ADDITIONAL USER COMMAND / PROMPT] when present.
12. NO TRANSCRIPT DUMP: NEVER paste the full transcript, "--- ORIGINAL POST ---", or long verbatim quotes—the site shows the video player above your text.
13. NO REPRODUCTION BLOCK: End with commentary paragraphs only, then SOURCE CREDITING.`;
  } else if (isYoutube) {
    youtubeBlock = `
11. YOUTUBE CONTEXT: This article is based on a video at ${ytRef}. Summarize key points while maintaining the journalistic persona.`;
  }

  return `
[PERSONA]:
- You are a senior investigative journalist and professional news editor.
- Your writing style is objective, authoritative, and concise.

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>WRITE A CATCHY HEADLINE HERE</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. THE OBSERVER: You are a reporter on the ground. The "Observed Details" provided below are your first-hand observations of the scene. The "Topic" is your assigned story angle.
2. NO META-COMMENTARY OR IMAGE REFERENCES: NEVER mention that you are analyzing an image, looking at a photo, or were provided with an analysis. NEVER use phrases like "The image features", "The photo shows", "Pictured here is", or "This image depicts". Write as if you are witnessing the event yourself and describing real-world subjects directly.
3. NO CONCLUDING SUMMARIES: Never start a paragraph with "In summary", "In conclusion", "Overall", or "Ultimately".
4. NO TRANSITIONAL CLICHÉS: Avoid "It is important to note", "In today's fast-paced world", or "Furthermore" at the start of sentences.
5. NO INTRO PHRASES: Do not include "Here is the article" or any meta-commentary.
6. JOURNALISTIC TONE: Focus on facts and implications. Do NOT use flowery language or AI-typical filler words.
7. NO MARKDOWN: Do not use bold, italics, or lists.
8. HEADLINE: The headline must be punchy and news-worthy, reflecting the provided Topic.
9. PARAGRAPH STRUCTURE: Divide the content into 3-5 distinct paragraphs. Use exactly two newlines (an empty line) between each paragraph for consistent spacing.
10. LANGUAGE: ${languageInstruction}${youtubeBlock}
11. ${creditYoutube}
`;
}

// Handles title extraction from the AI response.
function extractArticleData(
  responseText: string | null | undefined,
  fallbackTitle: string
) {
  if (!responseText) return { title: fallbackTitle, content: "" };

  const extractTag = (tag: string) => {
    const regex = new RegExp(`(?:\\*+)?<${tag}>(?:\\*+)?([\\s\\S]*?)(?:\\*+)?</${tag}>(?:\\*+)?`, "i");
    const match = responseText.match(regex);
    return match ? match[1].trim() : null;
  };

  let title = extractTag("title") || fallbackTitle;
  const content = extractTag("content") || "";

  // Sanity check for generic placeholders
  const genericPlaceholders = [
    "headline",
    "write a catchy headline here",
    "your catchy headline here",
    "title here",
    "article headline"
  ];

  if (genericPlaceholders.some(p => title.toLowerCase() === p.toLowerCase())) {
    title = fallbackTitle;
  }

  return { title, content };
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const json = await req.json();
    const result = RequestSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: result.error.issues.map(e => e.message).join(", ")
      }, { status: 400 });
    }

    const {
      topic,
      categoryId,
      language,
      content: rawContent,
      prompt: customPrompt,
      fileContent,
      imageUrl,
      youtubeUrl,
      type: requestType,
      generationMode,
    } = result.data;

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
    }

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

    const sessionRes = await fetch(`${baseUrl}/session-id`);
    if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
    const { session_id } = await sessionRes.json();

    const isYoutube = requestType === "youtube" || topic === "YouTube Video Article";
    const instruction = getAiSystemInstruction({
      isYoutube,
      youtubeUrl: (youtubeUrl || "").trim(),
      generationMode,
      requestedLanguage: language,
    });

    const user =
      (await prisma.user.findFirst({ where: { email: "admin@newsmedia.app" } })) ||
      (await prisma.user.findFirst());

    if (!user) throw new Error("No system user found for attribution");

    const shouldCreateRawVideo = Boolean(isYoutube && youtubeUrl && rawContent && rawContent.trim().length > 0);
    const rawVideo = shouldCreateRawVideo
      ? await prisma.rawVideo.create({
          data: {
            tenantId,
            language: typeof language === "string" && language.trim().length > 0 ? language.trim() : null,
            youtubeUrl: youtubeUrl!,
            transcribedContent: rawContent!,
            prompt: typeof customPrompt === "string" && customPrompt.trim().length > 0 ? customPrompt.trim() : null,
            generationMode,
          },
        })
      : null;

    let documentContext = "No additional content provided.";

    // If an image is provided, ensure it is analyzed first
    if (imageUrl && !isYoutube) {
      try {
        console.log("[Manual AI Generate] Triggering analysis for:", imageUrl);
        // Extract filename from URL/Key
        let s3Key = imageUrl;
        try {
          s3Key = new URL(imageUrl).pathname.slice(1);
        } catch (e) {
          console.warn("Invalid URL format for s3Key extraction:", imageUrl);
        }
        const filename = s3Key.split("/").pop() || "image.jpg";

        const analyzeRes = await fetch(`${baseUrl}/api/legal/analyze-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            s3_key: s3Key,
            filename: filename,
            session_id: session_id
          }),
        });

        if (analyzeRes.ok) {
          const analysisResult = await analyzeRes.json();
          // If the result is a plain string, we use it directly. 
          // If it's an object, we look for a text property.
          documentContext = typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult);
          console.log("[Manual AI Generate] Analysis successful, length:", documentContext.length);
        } else {
          const analyzeError = await analyzeRes.json().catch(() => ({}));
          console.error("[Manual AI Generate] Analysis failed:", analyzeError);
        }
      } catch (err) {
        console.error("[Manual AI Generate] Analysis trigger error:", err);
      }
    }

    const materialsText = [
      rawContent,
      fileContent ? `[FILE MATERIALS]:\n${fileContent}` : null
    ].filter(Boolean).join("\n\n");

    const truncatedInput = truncateContent(materialsText || "No additional content provided.");

    const aiPayload = {
      user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / FINAL TASK]:
Write a professional, investigative news article that is PRIMARILY BASED on the Topic provided, integrating the Observed Details naturally into the narrative as if you were reporting from the scene. Remember: NEVER mention analysis or photos.

${customPrompt ? `[ADDITIONAL USER COMMAND / PROMPT]:\n${customPrompt}\n` : ""}

[ASSIGNED STORY TOPIC]:
${topic || "Not provided"}

[SOURCE MATERIALS]:
${truncatedInput}
${documentContext !== "No additional content provided." ? `\n[OBSERVED DETAILS]:\n${documentContext}` : ""}

CRITICAL: Fulfill the USER REQUEST using the STRUCTURE defined in SYSTEM INSTRUCTIONS.

FINAL MANDATE: The entire response (Headline and Content) MUST be written in ${language || "the same language as the source"}. DO NOT use any other language.
`,
      session_id: session_id,
      persona_prefix: "NewsLetter",
      document_context: documentContext,
      image_context: imageUrl || ""
    };

    console.log("[Manual AI Generate] Sending Payload (Truncated):", JSON.stringify({ ...aiPayload, user_input: aiPayload.user_input.substring(0, 500) + "..." }, null, 2));

    const controller = new AbortController();
    const timeoutCount = 180000; // 180s
    const timeout = setTimeout(() => controller.abort(), timeoutCount);

    try {
      const chatRes = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!chatRes.ok) {
        const errorData = await chatRes.json().catch(() => ({}));
        console.error("[Manual AI Generate] Error Status:", chatRes.status, errorData);
        throw new Error(errorData?.detail || `AI service reported an error (Status: ${chatRes.status})`);
      }

      const { response } = await chatRes.json();
      if (!response) throw new Error("AI service returned empty response");

      const extracted = extractArticleData(response, topic || "New Article");
      const title = extracted.title;
      let content = extracted.content;

      if (isYoutube && generationMode === "commentary") {
        content = stripOriginalPostBlock(content);
      }

      if (!content || content.length < 50) {
        throw new Error("AI failed to generate a complete article. Please refine your prompt or materials and try again.");
      }

      const publishDate = new Date();
      const slug = await generateUniqueArticleSlug(prisma, title, publishDate);

      const contentArticle = await prisma.contentArticle.create({
        data: {
          tenantId,
          title,
          slug,
          content,
          imageUrl: imageUrl || null,
          status: "pending",
          usersId: user.id,
          categoryId: categoryId,
          publishDate,
          youtubeUrl: youtubeUrl || null,
          ...(rawVideo
            ? { rawVideoId: rawVideo.id, sourceType: "VIDEO" }
            : { sourceType: "MANUAL" }),
        },
      });

      sseBroadcaster.broadcast("articles:updated");
      return NextResponse.json(contentArticle);
    } catch (error: any) {
      clearTimeout(timeout);
      const isTimeout = error.name === "AbortError";
      return NextResponse.json(
        { error: isTimeout ? "AI generation request timed out." : error.message || "Failed to generate content" },
        { status: isTimeout ? 504 : 500 }
      );
    }
  } catch (error: any) {
    console.error("Manual AI Generation error:", error);
    return NextResponse.json({ error: "Invalid request or server error" }, { status: 400 });
  }
}
