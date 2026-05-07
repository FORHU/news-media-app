import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";
import { getTenantDomainFromRequest, resolveTenantIdFromRequest } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadToS3 } from "@/lib/s3";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RequestSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  topic: z.string().optional().default(""),
  prompt: z.string().optional().default(""),
  language: z.string().optional().default(""),
  extractedText: z.string().optional().default(""),
  s3ImageUrl: z.string().optional().or(z.literal("")).default(""),
  materialImages: z.array(z.string()).optional().default([]),
});

const DATA_URL_IMAGE_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

function detectImageExtension(mimeType: string): string {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg"; // Default to jpg to avoid Next.js .bin optimization errors
}

async function uploadBase64ImageToSupabase(dataUrl: string, tenantId: string): Promise<string> {
  const match = dataUrl.match(DATA_URL_IMAGE_REGEX);
  if (!match) {
    throw new Error("Invalid base64 image format.");
  }

  const mimeType = match[1];
  const base64Payload = match[2];
  const fileBuffer = Buffer.from(base64Payload, "base64");
  const extension = detectImageExtension(mimeType);
  const bucket = process.env.SUPABASE_ARTICLES_BUCKET || "articles";
  const path = `article-images/manual-uploads/${tenantId}/${Date.now()}-${randomUUID()}.${extension}`;

  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, fileBuffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase image upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Supabase image upload succeeded, but public URL is missing.");
  }

  return data.publicUrl;
}

function truncateContent(text: string, limit: number = 12000): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Truncated due to length]";
}

function getAiSystemInstruction(requestedLanguage?: string) {
  const languageInstruction = requestedLanguage 
    ? `You MUST write the article in ${requestedLanguage}. 
    
    [CRITICAL TRANSLATION STEP]:
    If you are translating between two non-English languages (e.g., Korean to Japanese, or Korean to Chinese), please follow this internal process:
    1. Mentally translate the key points of the source material into English.
    2. Then, rewrite and generate the final news article ENTIRELY in ${requestedLanguage} based on those English points.
    
    This pivot translation ensures the highest journalistic quality and accuracy. The final output must be 100% ${requestedLanguage}.`
    : `By default, write in the same language as the provided materials.`;

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
10. LANGUAGE: ${languageInstruction} If the [ADDITIONAL USER COMMAND / PROMPT] explicitly requests a different language, follow it.
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

    let tenantId = await resolveTenantIdFromRequest(req);
    if (tenantId) {
      const tenantExists = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true },
      });

      // In dev, cached tenant resolution can become stale after reseeding.
      // Re-resolve by current domain to avoid FK violations on inserts.
      if (!tenantExists) {
        const tenantDomain = getTenantDomainFromRequest(req);
        if (tenantDomain) {
          const freshTenant = await prisma.tenant.findUnique({
            where: { domain: tenantDomain },
            select: { id: true },
          });
          tenantId = freshTenant?.id ?? null;
        } else {
          tenantId = null;
        }
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant could not be resolved to a valid database tenant." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({ 
      where: { 
        id: categoryId,
        tenantId
      } 
    });
    if (!category) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
    }

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) {
      console.error("[createFromUpload] GENERATE_CONTENT_API is not configured");
      throw new Error("GENERATE_CONTENT_API is not configured");
    }

    console.log("[createFromUpload] Attempting to connect to AI service at:", `${baseUrl}/session-id`);
    let session_id: string;
    try {
      const sessionRes = await fetch(`${baseUrl}/session-id`);
      if (!sessionRes.ok) {
        console.error("[createFromUpload] session-id fetch failed with status:", sessionRes.status);
        throw new Error(`Could not connect to AI service (session-id) - Status: ${sessionRes.status}`);
      }
      const data = await sessionRes.json();
      session_id = data.session_id;
      console.log("[createFromUpload] AI Session ID acquired:", session_id);
    } catch (e: any) {
      console.error("[createFromUpload] AI Session fetch network error:", e.message);
      throw new Error(`AI Service Connection Error: ${e.message}`);
    }

    // Analyze material images
    let finalExtractedText = extractedText;
    if (parsed.data.materialImages && parsed.data.materialImages.length > 0) {
        console.log(`[createFromUpload] Found ${parsed.data.materialImages.length} material images. Starting analysis...`);
        const analyzedImageTexts = [];
        for (const base64Img of parsed.data.materialImages) {
            try {
                // Upload to S3 for the AI analysis endpoint
                const match = base64Img.match(DATA_URL_IMAGE_REGEX);
                if (!match) continue;
                const mimeType = match[1];
                const base64Payload = match[2];
                const fileBuffer = Buffer.from(base64Payload, "base64");
                const extension = detectImageExtension(mimeType);
                const analysisFilename = `material-${Date.now()}.${extension}`;
                
                const s3Url = await uploadToS3(fileBuffer, analysisFilename, mimeType);
                let s3Key = s3Url;
                try {
                    s3Key = new URL(s3Url).pathname.slice(1);
                } catch (e) {}

                console.log(`[createFromUpload] Analyzing uploaded image via S3: ${s3Url}`);

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
                    const text = typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult);
                    console.log(`[createFromUpload] Image analysis successful for ${analysisFilename} (length: ${text.length})`);
                    analyzedImageTexts.push(`[Image Analysis for ${analysisFilename}]:\n${text}`);
                } else {
                    const errorResponse = await analyzeRes.text();
                    console.error(`[createFromUpload] Image analysis failed for ${analysisFilename}. Status: ${analyzeRes.status}, Error: ${errorResponse}`);
                }
            } catch (err) {
                console.error("[createFromUpload] Exception during material image analysis:", err);
            }
        }
        if (analyzedImageTexts.length > 0) {
            console.log(`[createFromUpload] Successfully analyzed ${analyzedImageTexts.length} images.`);
            finalExtractedText = finalExtractedText 
                ? finalExtractedText + "\n\n" + analyzedImageTexts.join("\n\n")
                : analyzedImageTexts.join("\n\n");
        } else {
            console.log(`[createFromUpload] No image analysis results to append.`);
        }
    } else {
        console.log(`[createFromUpload] No material images found to analyze.`);
    }

    // 1) Store raw_source_uploads first (schema-aligned)
    // NOTE: This project uses a generated Prisma client output that currently
    // doesn't expose delegates for the new models, so we insert via SQL.
    const makeCuid = () =>
      `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random()
        .toString(36)
        .slice(2, 10)}`.slice(0, 25);

    const rawSourceUploadId = makeCuid();
    const normalizedIncomingImageUrl = s3ImageUrl?.trim() || "";
    const resolvedImageUrl = normalizedIncomingImageUrl.startsWith("data:image/")
      ? await uploadBase64ImageToSupabase(normalizedIncomingImageUrl, tenantId)
      : normalizedIncomingImageUrl;
    const promptToStore =
      [prompt, language ? `Write the entire article in ${language}.` : ""]
        .filter(Boolean)
        .join("\n\n")
        .trim() || null;
    const extractedTextToStore = finalExtractedText?.trim() ? finalExtractedText.trim() : null;
    const s3ImageUrlToStore = resolvedImageUrl || null;
    const languageToStore = language || null;

    const rawSourceUpload = await prisma.rawSourceUpload.create({
      data: {
        id: rawSourceUploadId,
        tenantId,
        prompt: promptToStore,
        s3ImageUrl: s3ImageUrlToStore,
        language: languageToStore,
        extractedText: extractedTextToStore,
      },
      select: { id: true },
    });

    // 2) Image analysis disabled as per user request for the featured image (s3ImageUrl), but applied for materialImages
    const documentContext = finalExtractedText || "No additional content provided.";

    const instruction = getAiSystemInstruction(language);
    const materials = truncateContent(finalExtractedText || "No additional content provided.");

    const aiPayload = {
      user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / FINAL TASK]:
Write a professional, investigative news article primarily based on the topic, using the materials above as evidence. Never mention analysis or photos.

${prompt ? `[ADDITIONAL USER COMMAND / PROMPT]:\n${prompt}\n` : ""}

[ASSIGNED STORY TOPIC]:
${topic || "Not provided"}

[SOURCE MATERIALS]:
${materials}

CRITICAL: Fulfill the USER REQUEST using the STRUCTURE defined in SYSTEM INSTRUCTIONS.

FINAL MANDATE: The entire response (Headline and Content) MUST be written in ${language || "the same language as the source"}. DO NOT use any other language.
`,
      session_id,
      persona_prefix: "NewsLetter",
      document_context: documentContext,
      image_context: resolvedImageUrl || "",
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
    try {
      console.log("[createFromUpload] Sending payload to AI service at:", `${baseUrl}/chat`);
      const chatRes = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!chatRes.ok) {
        const errorData = await chatRes.json().catch(() => ({}));
        console.error("[createFromUpload] AI chat failed with status:", chatRes.status, "Error:", errorData);
        throw new Error(errorData?.detail || `AI service error (${chatRes.status})`);
      }

      const { response } = await chatRes.json();
      console.log("[createFromUpload] AI Response received (length):", response?.length || 0);
      const { title, content } = extractArticleData(response, topic || "New Article");
      if (!content || content.length < 50) {
        throw new Error("AI returned incomplete article. Please refine your materials and try again.");
      }

      // 3) Save content_articles linked to raw_source_uploads (schema-aligned)
      const user =
        (await prisma.user.findFirst({ 
          where: { 
            email: "admin@newsmedia.app",
            tenantId
          } 
        })) ||
        (await prisma.user.findFirst({
          where: { tenantId }
        }));
      if (!user) throw new Error("No system user found for attribution");

      const publishDate = new Date();
      const slug = await generateUniqueArticleSlug(prisma, title, publishDate);

      const sourceType =
        resolvedImageUrl || (extractedText && extractedText.trim()) ? "UPLOAD" : "MANUAL";

      const contentArticle = await prisma.contentArticle.create({
        data: {
          tenantId,
          usersId: user.id,
          categoryId,
          rawSourceUploadId: rawSourceUpload.id,
          title,
          slug,
          publishDate,
          imageUrl: resolvedImageUrl || null,
          content,
          status: "pending",
          sourceType: sourceType as any,
        },
      });

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

