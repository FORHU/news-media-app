import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { sseBroadcaster } from "@/lib/sse";
import { env } from "@/lib/env";
import { generalPublishRepository } from "@/repositories/admin/generalPublish.repository";
import { createGeneralPublishFromUploadSchema } from "@/lib/validation/generalPublish";
import { approveChatSession } from "@/lib/generateContentApi";

// Tenant-agnostic by design (see ../route.ts). Adapted from
// src/app/api/admin/generatedArticles/createFromUpload/route.ts: same AI-call
// shape, but calls the AI service exactly ONCE (not once per target tenant)
// and fans the single result out to every target tenant via
// generalPublishRepository.createBroadcast. No RawSourceUpload row is created
// — that model is tenant-scoped 1:1 with a single ContentArticle, so broadcast
// articles simply carry no raw-source link (same as manual-entry articles).

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DATA_URL_IMAGE_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

function detectImageExtension(mimeType: string): string {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg";
}

async function uploadBase64ImageToS3(dataUrl: string): Promise<string> {
  const match = dataUrl.match(DATA_URL_IMAGE_REGEX);
  if (!match) throw new Error("Invalid base64 image format.");

  const mimeType = match[1];
  const fileBuffer = Buffer.from(match[2], "base64");
  const extension = detectImageExtension(mimeType);
  const filename = `general-publish-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  return uploadToS3(fileBuffer, filename, mimeType);
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
    const regex = new RegExp(`(?:\\*+)?<${tag}>(?:\\*+)?([\\s\\S]*?)(?:\\*+)?</${tag}>(?:\\*+)?`, "i");
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
    const parsed = createGeneralPublishFromUploadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { category, topic, prompt, language, extractedText, s3ImageUrl } = parsed.data;

    const baseUrl = env.GENERATE_CONTENT_API;
    if (!baseUrl) {
      console.error("[generalPublish/createFromUpload] GENERATE_CONTENT_API is not configured");
      throw new Error("GENERATE_CONTENT_API is not configured");
    }

    let session_id: string;
    try {
      const sessionRes = await fetch(`${baseUrl}/session-id`);
      if (!sessionRes.ok) {
        throw new Error(`Could not connect to AI service (session-id) - Status: ${sessionRes.status}`);
      }
      const data = await sessionRes.json();
      session_id = data.session_id;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`AI Service Connection Error: ${message}`);
    }

    // Analyze material images
    let finalExtractedText = extractedText;
    if (parsed.data.materialImages && parsed.data.materialImages.length > 0) {
      const analyzedImageTexts: string[] = [];
      for (const base64Img of parsed.data.materialImages) {
        try {
          const match = base64Img.match(DATA_URL_IMAGE_REGEX);
          if (!match) continue;
          const mimeType = match[1];
          const base64Payload = match[2];
          const fileBuffer = Buffer.from(base64Payload, "base64");
          const extension = detectImageExtension(mimeType);

          const s3Url = await uploadToS3(fileBuffer, `material.${extension}`, mimeType);
          let s3Key = s3Url;
          try {
            s3Key = new URL(s3Url).pathname.slice(1);
          } catch {}
          const analysisFilename = s3Key.split("/").pop() || `material.${extension}`;

          const analyzeRes = await fetch(`${baseUrl}/api/legal/analyze-document`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ s3_key: s3Key, filename: analysisFilename, session_id }),
          });

          if (analyzeRes.ok) {
            const analysisResult = await analyzeRes.json();
            const text = typeof analysisResult === "string" ? analysisResult : JSON.stringify(analysisResult);
            analyzedImageTexts.push(`[Image Analysis for ${analysisFilename}]:\n${text}`);
          }
        } catch (err) {
          console.error("[generalPublish/createFromUpload] Exception during material image analysis:", err);
        }
      }
      if (analyzedImageTexts.length > 0) {
        finalExtractedText = finalExtractedText
          ? finalExtractedText + "\n\n" + analyzedImageTexts.join("\n\n")
          : analyzedImageTexts.join("\n\n");
      }
    }

    const normalizedIncomingImageUrl = s3ImageUrl?.trim() || "";
    const resolvedImageUrl = normalizedIncomingImageUrl.startsWith("data:image/")
      ? await uploadBase64ImageToS3(normalizedIncomingImageUrl)
      : normalizedIncomingImageUrl;

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
      const chatRes = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!chatRes.ok) {
        const errorData: { detail?: string } = await chatRes.json().catch(() => ({}));
        throw new Error(errorData?.detail || `AI service error (${chatRes.status})`);
      }

      const { response } = (await chatRes.json()) as { response?: string };
      const { title, content } = extractArticleData(response, topic || "New Article");
      if (!content || content.length < 50) {
        throw new Error("AI returned incomplete article. Please refine your materials and try again.");
      }

      await approveChatSession(baseUrl, session_id);

      const { generalPublishId, outcomes } = await generalPublishRepository.createBroadcast({
        title,
        content,
        category,
        imageUrls: resolvedImageUrl ? [resolvedImageUrl] : [],
        publish: false,
      });

      sseBroadcaster.broadcast("articles:updated");
      return NextResponse.json({ generalPublishId, outcomes, title, content });
    } catch (error: unknown) {
      clearTimeout(timeout);
      const isTimeout = error instanceof Error && error.name === "AbortError";
      const message = error instanceof Error ? error.message : "Server error";
      return NextResponse.json(
        { error: isTimeout ? "AI generation request timed out." : message },
        { status: isTimeout ? 504 : 500 }
      );
    }
  } catch (error: unknown) {
    console.error("[generalPublish/createFromUpload] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
