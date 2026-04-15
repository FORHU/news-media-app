import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RequestSchema = z.object({
  topic: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  content: z.string().optional(),
  prompt: z.string().optional(),
  fileContent: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["manual", "youtube"]).optional(),
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
function getAiSystemInstruction(isYoutube: boolean) {
  const specializedGuidance = isYoutube 
    ? "The following content is a VIDEO TRANSCRIPT. Your primary task is to 'de-noise' it by removing verbal fillers, repetitive spoken phrases, and conversational 'ums/ahs'. Convert the transcription into a formal news narrative while preserving all factual information and quotes."
    : "The following content consists of TOPIC NOTES and SOURCE MATERIALS. Your task is to synthesize these materials into a cohesive, structured, and expanded news article.";

  return `
[PERSONA]:
- You are a senior investigative journalist and professional news editor.
- Your writing style is objective, authoritative, and concise.

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>WRITE A CATCHY HEADLINE HERE</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. ${specializedGuidance}
2. NO CONCLUDING SUMMARIES: Never start a paragraph with "In summary", "In conclusion", "Overall", or "Ultimately".
3. NO TRANSITIONAL CLICHÉS: Avoid "It is important to note", "In today's fast-paced world", or "Furthermore" at the start of sentences.
4. NO INTRO PHRASES: Do not include "Here is the article" or any meta-commentary.
5. JOURNALISTIC TONE: Focus on facts and implications. Do NOT use flowery language or AI-typical filler words.
6. NO MARKDOWN: Do not use bold, italics, or lists unless it is part of the provided source materials.
7. HEADLINE: The headline must be punchy and news-worthy, not generic.
8. PARAGRAPH STRUCTURE: Divide the content into 3-5 distinct paragraphs. Use double newlines (\\n\\n) between each paragraph for absolute clarity.

[OUTPUT]: Write strictly in English unless otherwise requested.
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
      content: rawContent,
      prompt: customPrompt,
      fileContent,
      imageUrl,
      youtubeUrl,
      type: requestType
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
    const instruction = getAiSystemInstruction(isYoutube);

    const materialsText = [
      rawContent,
      fileContent ? `[FILE MATERIALS]:\n${fileContent}` : null
    ].filter(Boolean).join("\n\n");

    const truncatedInput = truncateContent(materialsText || "No additional content provided.");

    // Construct the manual prompt
    const aiPayload = {
      user_input: `
[ARTICLE CONTEXT / TOPIC]:
${topic || "Not provided"}

[SOURCE MATERIALS]:
${truncatedInput}

[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / FINAL TASK]:
${customPrompt || "Generate a professional news article based on the provided context and materials. Ensure it is in English."}

CRITICAL: Fulfill the USER REQUEST using the STRUCTURE defined in SYSTEM INSTRUCTIONS.
`,
      session_id,
      persona_prefix: "NewsLetter",
      document_context: truncatedInput,
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
      const content = extracted.content;

      if (!content || content.length < 50) {
        throw new Error("AI failed to generate a complete article. Please refine your prompt or materials and try again.");
      }

      const user =
        (await prisma.user.findUnique({ where: { email: "admin@newsmedia.app" } })) ||
        (await prisma.user.findFirst());

      if (!user) throw new Error("No system user found for attribution");

      const publishDate = new Date();
      const slug = await generateUniqueArticleSlug(prisma, title, publishDate);

      const contentArticle = await prisma.contentArticle.create({
        data: {
          title,
          slug,
          content,
          imageUrl: imageUrl || null,
          status: "pending",
          usersId: user.id,
          categoryId: categoryId,
          publishDate,
          youtubeUrl: youtubeUrl || null,
        },
      });

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
