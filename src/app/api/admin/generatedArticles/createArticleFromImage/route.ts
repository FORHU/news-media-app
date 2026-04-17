import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generateUniqueArticleSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// AI persona/instruction
function getAiSystemInstruction() {
  return `
[PERSONA]:
- You are a senior investigative journalist and professional news editor.
- Your writing style is objective, authoritative, and concise.

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>WRITE A CATCHY HEADLINE HERE</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. The following content consists of IMAGE ANALYSIS results. Your task is to synthesize these materials into a cohesive, structured, and expanded news article.
2. NO CONCLUDING SUMMARIES: Never start a paragraph with "In summary", "In conclusion", "Overall", or "Ultimately".
3. NO TRANSITIONAL CLICHÉS: Avoid "It is important to note", "In today's fast-paced world", or "Furthermore" at the start of sentences.
4. NO INTRO PHRASES: Do not include "Here is the article" or any meta-commentary.
5. JOURNALISTIC TONE: Focus on facts and implications. Do NOT use flowery language or AI-typical filler words.
6. NO MARKDOWN: Do not use bold, italics, or lists unless it is part of the provided source materials.
7. HEADLINE: The headline must be punchy and news-worthy, not generic.
8. PARAGRAPH STRUCTURE: Divide the content into 3-5 distinct paragraphs. Use exactly two newlines (an empty line) between each paragraph for consistent spacing.
9. OUTPUT: Write strictly in English unless otherwise requested.
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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const categoryId = formData.get("categoryId") as string;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // 1. Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";
    const fileName = file.name;
    const imageUrl = await uploadToS3(buffer, fileName, contentType);

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
    }

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

    // 2. Get FastAPI Session
    const sessionRes = await fetch(`${baseUrl}/session-id`);
    if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
    const { session_id } = await sessionRes.json();

    // 3. Document Analysis via FastAPI
    // Extract S3 Key from URL
    const s3Key = imageUrl.split(process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "").pop()?.replace(/^\//, "") || imageUrl;
    const analysisFilename = s3Key.split("/").pop() || "image.jpg";

    let documentContext = "No additional content provided.";
    try {
      console.log("[Create from Image] Triggering analysis for:", imageUrl);
      const analyzeRes = await fetch(`${baseUrl}/api/legal/analyze-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3_key: s3Key,
          filename: analysisFilename,
          session_id: session_id
        }),
      });

      if (analyzeRes.ok) {
        const analysisResult = await analyzeRes.json();
        documentContext = typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult);
        console.log("[Create from Image] Analysis successful, length:", documentContext.length);
      } else {
        const analyzeError = await analyzeRes.json().catch(() => ({}));
        console.error("[Create from Image] Analysis failed:", analyzeError);
        // We continue even if analysis fails, though article quality will suffer
      }
    } catch (err) {
      console.error("[Create from Image] Analysis trigger error:", err);
    }

    // 4. AI Generation
    const instruction = getAiSystemInstruction();
    const fullPrompt = `
[ARTICLE CONTEXT / IMAGE ANALYSIS]:
${documentContext}

[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / FINAL TASK]:
Generate a professional news article based on the provided image analysis and context. Ensure it is in English.

CRITICAL: Fulfill the USER REQUEST using the STRUCTURE defined in SYSTEM INSTRUCTIONS.
`;

    const aiPayload = {
      user_input: fullPrompt,
      session_id: session_id,
      persona_prefix: "NewsLetter",
      document_context: documentContext,
      image_context: imageUrl
    };

    console.log("[Create from Image] Sending Payload to AI...");

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
        throw new Error(errorData?.detail || `AI service reported an error (Status: ${chatRes.status})`);
      }

      const { response } = await chatRes.json();
      if (!response) throw new Error("AI service returned empty response");

      const extracted = extractArticleData(response, "New Article from Image");
      const title = extracted.title;
      const content = extracted.content;

      if (!content || content.length < 50) {
        throw new Error("AI failed to generate a complete article. Please try again with a clearer image.");
      }

      // 5. Database Save
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
          imageUrl,
          status: "pending",
          usersId: user.id,
          categoryId: categoryId,
          publishDate,
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
    console.error("Create Article from Image error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
