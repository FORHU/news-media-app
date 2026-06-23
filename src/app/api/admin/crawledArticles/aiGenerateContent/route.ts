import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { getValidImageSrc } from "@/lib/image-utils";
import { getOpenAiImageModel } from "@/lib/openaiImages";
import { runOpenAiFeaturedImagePipeline } from "@/lib/featuredImagePipeline";
import type { FeaturedImageGenerationLog } from "@/lib/featuredImageGeneration";
import { sseBroadcaster } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Allow up to 5 minutes on Vercel Pro/Enterprise

const RequestSchema = z.object({
  articleId: z.string().min(1, "articleId is required"),
  categoryId: z.string().min(1, "categoryId is required"),
  generationPrompt: z.string().optional().or(z.literal("")),
  language: z.string().optional(),
  generateImage: z.boolean().optional().default(false),
});

// Safety truncation to avoid token limit errors
function truncateContent(text: string, limit: number = 12000): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Truncated due to length]";
}

// AI persona/instruction
function getAiSystemInstruction(sourceUrl?: string, requestedLanguage?: string) {
  const creditInstruction = sourceUrl
    ? `SOURCE CREDITING: You MUST end the article with exactly one line: "Reference: ${sourceUrl}". This line must be inside the <content> tag and separated from the last paragraph by exactly two newlines (an empty line between them).`
    : "";

  const languageInstruction = requestedLanguage 
    ? `You MUST write the article in ${requestedLanguage}. 
    
    [CRITICAL TRANSLATION STEP]:
    If you are translating between two non-English languages (e.g., Korean to Japanese, or Korean to Chinese), please follow this internal process:
    1. Mentally translate the key points of the source material into English.
    2. Then, rewrite and generate the final news article ENTIRELY in ${requestedLanguage} based on those English points.
    
    This pivot translation ensures the highest journalistic quality and accuracy. The final output must be 100% ${requestedLanguage}.`
    : `By default, you MUST write the article in the SAME LANGUAGE as the provided [SOURCE ARTICLE] (e.g., if the source article is in Korean, write the generated article in Korean).`;

  return `
[PERSONA]:
- You are a senior investigative journalist and professional news editor.
- Your writing style is objective, authoritative, and concise.

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>WRITE A CATCHY HEADLINE HERE</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. FACTUAL GROUNDING: You may ONLY state facts, names, dates, numbers, quotes, book titles, anniversaries, and claims that appear in the [SOURCE ARTICLE] (or are direct paraphrases of them). Do NOT invent specifics to sound authoritative. If the source does not mention something, omit it—do not guess or fill gaps with plausible-sounding details.
2. NO FABRICATION: Do not invent interviews, studies, statistics, future dates, or publication schedules unless they are explicitly in the source.
3. THE REWRITER: The [SOURCE ARTICLE] is your sole factual basis. Write a clear news-style rewrite in your own words, but do not treat it as a prompt to imagine new scenes or "report from the field" beyond what the source actually says.
4. NO META-COMMENTARY: NEVER mention that you are analyzing an article, looking at a photo, or were provided with an analysis.
5. NO CONCLUDING SUMMARIES: Never start a paragraph with "In summary", "In conclusion", "Overall", or "Ultimately".
6. NO TRANSITIONAL CLICHÉS: Avoid "It is important to note", "In today's fast-paced world", or "Furthermore" at the start of sentences.
7. NO INTRO PHRASES: Do not include "Here is the article" or any meta-commentary.
8. JOURNALISTIC TONE: Focus on facts and implications that the source supports. Do NOT use flowery language or AI-typical filler words.
9. NO MARKDOWN: Do not use bold, italics, or lists.
10. HEADLINE: The headline must be punchy and must reflect the source—no clickbait claims absent from the source.
11. PARAGRAPH STRUCTURE: Divide the content into 3-5 distinct paragraphs. Use exactly two newlines (an empty line) between each paragraph for consistent spacing.
12. LANGUAGE: ${languageInstruction}${creditInstruction ? `\n13. ${creditInstruction}` : ""}
`;
}

// Handles data extraction from the AI response.
function extractArticleData(
  responseText: string | null | undefined,
  fallbackTitle: string
) {
  if (!responseText) return { title: fallbackTitle, content: "" };

  const extractTag = (tag: string) => {
    // Robustly find tags even if AI adds bolding or spaces: e.g. **<title>**
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
  let articleId: string | undefined;
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
      articleId: bodyArticleId,
      categoryId,
      generationPrompt: customPrompt,
      language: requestedLanguage,
      generateImage,
    } = result.data;

    articleId = bodyArticleId;

    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

    const rawArticle = await prisma.rawArticle.findUnique({
      where: { id: articleId, tenantId },
      include: { crawledUrl: true }
    });
    if (!rawArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const sessionRes = await fetch(`${baseUrl}/session-id`);
    if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
    const { session_id } = await sessionRes.json();

    const instruction = getAiSystemInstruction(rawArticle.crawledUrl?.url, requestedLanguage);

    const truncatedInput = truncateContent(rawArticle.content || "No content provided.");
    const aiPayload = {
      user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / FINAL TASK]:
Write a professional, investigative news article that is PRIMARILY BASED on the Source Article, integrating the details naturally into the narrative as if you were reporting from the scene. Remember: NEVER mention analysis or photos.

${customPrompt ? `[ADDITIONAL USER COMMAND / PROMPT]:\n${customPrompt}\n` : ""}

[SOURCE ARTICLE]:
${truncatedInput}

CRITICAL: Fulfill the USER REQUEST using the STRUCTURE defined in SYSTEM INSTRUCTIONS.

FINAL MANDATE: The entire response (Headline and Content) MUST be written in ${requestedLanguage || "the same language as the source"}. DO NOT use any other language.
`,
      session_id,
      persona_prefix: "NewsLetter",
      raw_article_id: articleId,
      document_context: truncatedInput,
    };

    console.log("[AI Generate] Sending Payload (Truncated if necessary):", JSON.stringify({ ...aiPayload, user_input: aiPayload.user_input.substring(0, 500) + "..." }, null, 2));

    const controller = new AbortController();
    const timeoutCount = 180000; // 180s
    const timeout = setTimeout(() => controller.abort(), timeoutCount);

    let title = "";
    let content = "";
    const resolvedCategoryId = categoryId;

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
        console.error("[AI Generate] Error Status:", chatRes.status, errorData);
        const errorMsg = errorData?.detail || errorData?.error || `AI service reported an error (Status: ${chatRes.status})`;
        throw new Error(errorMsg);
      }

      const rawJson = await chatRes.json();
      const response = rawJson.response ?? rawJson.text ?? rawJson.content ?? rawJson.result ?? rawJson.output ?? null;
      if (!response) throw new Error(`AI service returned empty response. Keys: ${Object.keys(rawJson).join(", ")}`);

      const extracted = extractArticleData(response, rawArticle.title);
      title = extracted.title;
      content = extracted.content;

      if (!content || content.length < 50) {
        throw new Error("AI failed to generate a complete article. Please refine your custom prompt and try again.");
      }

      const fallbackThumb = getValidImageSrc(rawArticle.imageUrl);
      const imageModel = getOpenAiImageModel();
      let resolvedImageUrl: string | null = null;

      let featuredImageLog: FeaturedImageGenerationLog = {
        requested: false,
        openAiModel: imageModel,
        apiKind: "none",
        pipelineLabel: "No AI featured image step",
        outcome: "not_requested",
        detail: "generateImage was not requested.",
      };

      if (generateImage) {
        const pipeline = await runOpenAiFeaturedImagePipeline({
          tenantId,
          articleTitle: title,
          userPrompt: customPrompt || "",
          sourceImageUrl: rawArticle.imageUrl,
          storyContext: truncateContent(content || "", 900),
        });
        resolvedImageUrl = pipeline.imageUrl;
        featuredImageLog = pipeline.log;
      } else if (fallbackThumb) {
        resolvedImageUrl = fallbackThumb;
      }

      console.log(
        "[AI Generate] Featured image pipeline:",
        JSON.stringify(featuredImageLog, null, 2)
      );

      const user =
        (await prisma.user.findFirst({ where: { email: "admin@newsmedia.app", tenantId } })) ||
        (await prisma.user.findFirst({ where: { tenantId } }));

      if (!user) throw new Error("No system user found for attribution");

      const publishDate = new Date();
      const slug = await generateUniqueArticleSlug(prisma, title, publishDate);

      const contentArticle = await prisma.contentArticle.create({
        data: {
          tenantId,
          title,
          slug,
          content,
          status: "pending",
          usersId: user.id,
          categoryId: resolvedCategoryId,
          rawArticleId: rawArticle.id,
          publishDate,
          imageUrl: resolvedImageUrl,
        },
      });

      await prisma.rawArticle.update({
        where: { id: articleId, tenantId },
        data: { status: "generated" },
      });

      sseBroadcaster.broadcast("articles:updated");
      sseBroadcaster.broadcast("rawArticles:updated");
      return NextResponse.json({
        ...contentArticle,
        imageGeneration: featuredImageLog,
      });
    } catch (error: unknown) {
      clearTimeout(timeout);

      // Update status to failed only if it was a real attempt
      if (articleId) {
        await prisma.rawArticle.update({
          where: { id: articleId, tenantId },
          data: { status: "failed" },
        }).catch(err => console.error("Failed to set article as failed:", err));
      }

      const isTimeout = error instanceof Error && error.name === "AbortError";
      const errorMsg = error instanceof Error ? error.message?.toLowerCase() || "" : "";
      const isTokenLimit = errorMsg.includes("token") || errorMsg.includes("limit") || errorMsg.includes("too long");

      let message = error instanceof Error ? error.message || "Failed to generate AI content" : "Failed to generate AI content";
      if (isTimeout) {
        message = "AI generation request timed out after 3 minutes. The article might be too large or the service is under heavy load.";
      } else if (isTokenLimit) {
        message = "The article is too long for the AI model to process. Try a shorter custom prompt or smaller article.";
      }

      return NextResponse.json({ error: message }, { status: isTimeout ? 504 : 500 });
    }
  } catch (error: unknown) {
    console.error("AI Generation Payload error:", error);
    return NextResponse.json({ error: "Invalid request or server error" }, { status: 400 });
  }
}
