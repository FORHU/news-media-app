import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RequestSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  topic: z.string().optional().default(""),
  prompt: z.string().optional().default(""),
  language: z.string().optional().default(""),
  extractedText: z.string().optional().default(""),
  s3ImageUrl: z.string().url().optional().or(z.literal("")).default(""),
});

function truncateContent(text: string, limit: number = 12000): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Truncated due to length]";
}

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
1. THE OBSERVER: You are a reporter on the ground. The "Observed Details" provided below are your first-hand observations of the scene. The "Topic" is your assigned story angle.
2. NO META-COMMENTARY OR IMAGE REFERENCES: NEVER mention that you are analyzing an image, looking at a photo, or were provided with an analysis. NEVER use phrases like "The image features", "The photo shows", "Pictured here is", or "This image depicts".
3. NO CONCLUDING SUMMARIES: Never start a paragraph with "In summary", "In conclusion", "Overall", or "Ultimately".
4. NO TRANSITIONAL CLICHÉS: Avoid "It is important to note" or "Furthermore" at the start of sentences.
5. NO INTRO PHRASES: Do not include "Here is the article" or any meta-commentary.
6. JOURNALISTIC TONE: Focus on facts and implications.
7. NO MARKDOWN: Do not use bold, italics, or lists.
8. HEADLINE: The headline must be punchy and news-worthy.
9. PARAGRAPH STRUCTURE: Divide the content into 3-5 distinct paragraphs. Use exactly two newlines (an empty line) between each paragraph.
10. LANGUAGE: By default, write in the same language as the provided materials. If the user prompt explicitly requests a language, follow it.
`;
}

function extractArticleData(responseText: string | null | undefined, fallbackTitle: string) {
  if (!responseText) return { title: fallbackTitle, content: "" };

  const extractTag = (tag: string) => {
    const regex = new RegExp(
      `(?:\\*+)?<${tag}>(?:\\*+)?([\\s\\S]*?)(?:\\*+)?</${tag}>(?:\\*+)?`,
      "i"
    );
    const match = responseText.match(regex);
    return match ? match[1].trim() : null;
  };

  const title = extractTag("title") || fallbackTitle;
  const content = extractTag("content") || "";
  return { title, content };
}

async function analyzeIfImageProvided(baseUrl: string, session_id: string, s3ImageUrl: string) {
  if (!s3ImageUrl) return { documentContext: "No additional content provided." };

  let s3Key = s3ImageUrl;
  try {
    s3Key = new URL(s3ImageUrl).pathname.slice(1);
  } catch {
    // If it's already a key, keep it as-is
  }
  const filename = s3Key.split("/").pop() || "image.jpg";

  try {
    const analyzeRes = await fetch(`${baseUrl}/api/legal/analyze-document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ s3_key: s3Key, filename, session_id }),
    });

    if (!analyzeRes.ok) {
      const analyzeError = await analyzeRes.json().catch(() => ({}));
      console.error("[createFromUpload] Analysis failed:", analyzeError);
      return { documentContext: "No additional content provided." };
    }

    const analysisResult = await analyzeRes.json();
    const documentContext =
      typeof analysisResult === "string" ? analysisResult : JSON.stringify(analysisResult);
    return { documentContext };
  } catch (err) {
    console.error("[createFromUpload] Analysis error:", err);
    return { documentContext: "No additional content provided." };
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { categoryId, topic, prompt, language, extractedText, s3ImageUrl } = parsed.data;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
    }

    // 1) Store raw_source_uploads first (schema-aligned)
    // NOTE: This project uses a generated Prisma client output that currently
    // doesn't expose delegates for the new models, so we insert via SQL.
    const makeCuid = () =>
      `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random()
        .toString(36)
        .slice(2, 10)}`.slice(0, 25);

    const rawSourceUploadId = makeCuid();
    const promptToStore =
      [prompt, language ? `Write the entire article in ${language}.` : ""]
        .filter(Boolean)
        .join("\n\n")
        .trim() || null;
    const extractedTextToStore = extractedText?.trim() ? extractedText.trim() : null;
    const s3ImageUrlToStore = s3ImageUrl || null;
    const languageToStore = language || null;

    await prisma.$executeRaw`
      INSERT INTO raw_source_uploads (
        id,
        prompt,
        s3_image_url,
        language,
        extracted_text,
        created_at,
        updated_at
      ) VALUES (
        ${rawSourceUploadId},
        ${promptToStore},
        ${s3ImageUrlToStore},
        ${languageToStore},
        ${extractedTextToStore},
        now(),
        now()
      )
    `;

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

    const sessionRes = await fetch(`${baseUrl}/session-id`);
    if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
    const { session_id } = await sessionRes.json();

    // 2) Optional image analysis (if s3ImageUrl present)
    const { documentContext } = await analyzeIfImageProvided(baseUrl, session_id, s3ImageUrl);

    const instruction = getAiSystemInstruction();
    const materials = truncateContent(extractedText || "No additional content provided.");

    const fullPrompt = `
[ASSIGNED STORY TOPIC]:
${topic || "Not provided"}

[SOURCE MATERIALS]:
${materials}
${documentContext !== "No additional content provided." ? `\n[OBSERVED DETAILS]:\n${documentContext}` : ""}

[SYSTEM INSTRUCTIONS]:
${instruction}

${prompt ? `[ADDITIONAL USER COMMAND / PROMPT]:\n${prompt}\n` : ""}

[USER REQUEST / FINAL TASK]:
Write a professional, investigative news article primarily based on the topic, using the materials above as evidence. Never mention analysis or photos.
`;

    const aiPayload = {
      user_input: fullPrompt,
      session_id,
      persona_prefix: "NewsLetter",
      document_context: documentContext,
      image_context: s3ImageUrl || "",
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
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
        throw new Error(errorData?.detail || `AI service error (${chatRes.status})`);
      }

      const { response } = await chatRes.json();
      const { title, content } = extractArticleData(response, topic || "New Article");
      if (!content || content.length < 50) {
        throw new Error("AI returned incomplete article. Please refine your materials and try again.");
      }

      // 3) Save content_articles linked to raw_source_uploads (schema-aligned)
      const user =
        (await prisma.user.findUnique({ where: { email: "admin@newsmedia.app" } })) ||
        (await prisma.user.findFirst());
      if (!user) throw new Error("No system user found for attribution");

      const publishDate = new Date();
      const slug = await generateUniqueArticleSlug(prisma, title, publishDate);

      // Prisma client in this repo may not be in sync with the pushed schema yet
      // (runtime validation error for new fields). Insert via SQL to guarantee schema alignment.
      const contentArticleId = makeCuid();
      const sourceType =
        s3ImageUrl || (extractedText && extractedText.trim()) ? "UPLOAD" : "MANUAL";

      await prisma.$executeRaw`
        INSERT INTO content_articles (
          id,
          users_id,
          category_id,
          raw_source_uploads_id,
          title,
          slug,
          publish_date,
          image_url,
          content,
          status,
          source_type,
          created_at,
          updated_at
        ) VALUES (
          ${contentArticleId},
          ${user.id},
          ${categoryId},
          ${rawSourceUploadId},
          ${title},
          ${slug},
          ${publishDate},
          ${s3ImageUrl || null},
          ${content},
          ${"pending"},
          ${sourceType}::"SourceType",
          now(),
          now()
        )
      `;

      const contentArticle = (
        await prisma.$queryRaw<
          Array<{
            id: string;
            title: string;
            slug: string | null;
            content: string;
            imageUrl: string | null;
            status: string;
            usersId: string;
            categoryId: string;
            publishDate: Date | null;
            rawSourceUploadId: string | null;
            sourceType: string | null;
            createdAt: Date;
            updatedAt: Date;
          }>
        >`
          SELECT
            id,
            title,
            slug,
            content,
            image_url as "imageUrl",
            status,
            users_id as "usersId",
            category_id as "categoryId",
            publish_date as "publishDate",
            raw_source_uploads_id as "rawSourceUploadId",
            source_type as "sourceType",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM content_articles
          WHERE id = ${contentArticleId}
          LIMIT 1
        `
      )[0];

      return NextResponse.json(contentArticle);
    } catch (error: any) {
      clearTimeout(timeout);
      const isTimeout = error?.name === "AbortError";
      return NextResponse.json(
        { error: isTimeout ? "AI generation request timed out." : error?.message || "Server error" },
        { status: isTimeout ? 504 : 500 }
      );
    }
  } catch (error: any) {
    console.error("[createFromUpload] Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

