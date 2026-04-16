import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Allow up to 5 minutes on Vercel Pro/Enterprise

const RequestSchema = z.object({
  articleId: z.string().min(1, "articleId is required"),
  categoryId: z.string().min(1, "categoryId is required"),
  generationPrompt: z.string().optional().or(z.literal("")),
});

// Safety truncation to avoid token limit errors
function truncateContent(text: string, limit: number = 12000): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Truncated due to length]";
}

// AI persona/instruction
function getAiSystemInstruction(sourceUrl?: string) {
  const creditInstruction = sourceUrl 
    ? `\n9. SOURCE CREDITING: You MUST end the article with exactly one line: "Source: ${sourceUrl}". This line must be inside the <content> tag, separated from the last paragraph by two newlines.`
    : "";

  return `
[PERSONA]:
- You are a senior investigative journalist and professional news editor.
- Your writing style is objective, authoritative, and concise.

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>Headline</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. NO CONCLUDING SUMMARIES: Never start a paragraph with "In summary", "In conclusion", "Overall", or "Ultimately".
2. NO TRANSITIONAL CLICHÉS: Avoid "It is important to note", "In today's fast-paced world", or "Furthermore" at the start of sentences.
3. NO INTRO PHRASES: Do not include "Here is the article" or any meta-commentary.
4. JOURNALISTIC TONE: Focus on facts and implications. Do NOT use flowery language or AI-typical filler words.
5. NO MARKDOWN: Do not use bold, italics, or lists.
6. HEADLINE: The headline must be punchy and news-worthy.
7. PARAGRAPH STRUCTURE: Divide the content into 3-5 distinct paragraphs. Use double newlines (\\n\\n) between each paragraph.
8. OUTPUT: Write strictly in English unless otherwise requested.${creditInstruction}
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
      generationPrompt: customPrompt 
    } = result.data;
    
    articleId = bodyArticleId;

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

    const rawArticle = await prisma.rawArticle.findUnique({
      where: { id: articleId },
      include: { crawledUrl: true }
    });
    if (!rawArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const sessionRes = await fetch(`${baseUrl}/session-id`);
    if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
    const { session_id } = await sessionRes.json();

    const instruction = getAiSystemInstruction(rawArticle.crawledUrl?.url);

    const truncatedInput = truncateContent(rawArticle.content || "No content provided.");
    const aiPayload = {
      user_input: `
[SOURCE ARTICLE]:
${truncatedInput}

[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / FINAL TASK]:
${customPrompt || "Translate to English and rewrite professionally."}

CRITICAL: Fulfill the USER REQUEST using the STRUCTURE defined in SYSTEM INSTRUCTIONS.
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
    let resolvedCategoryId = categoryId;

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

      const { response } = await chatRes.json();
      if (!response) throw new Error("AI service returned empty response");

      // Extract parts using the helper
      const extracted = extractArticleData(response, rawArticle.title);
      title = extracted.title;
      content = extracted.content;

      if (!content || content.length < 50) {
        throw new Error("AI failed to generate a complete article. Please refine your custom prompt and try again.");
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
          status: "pending",
          usersId: user.id,
          categoryId: resolvedCategoryId,
          rawArticleId: rawArticle.id,
          publishDate,
        },
      });

      await prisma.rawArticle.update({
        where: { id: articleId },
        data: { status: "generated" },
      });

      return NextResponse.json(contentArticle);
    } catch (error: any) {
      clearTimeout(timeout);

      // Update status to failed only if it was a real attempt
      if (articleId) {
        await prisma.rawArticle.update({
          where: { id: articleId },
          data: { status: "failed" },
        }).catch(err => console.error("Failed to set article as failed:", err));
      }

      const isTimeout = error.name === "AbortError";
      const errorMsg = error.message?.toLowerCase() || "";
      const isTokenLimit = errorMsg.includes("token") || errorMsg.includes("limit") || errorMsg.includes("too long");

      let message = error.message || "Failed to generate AI content";
      if (isTimeout) {
        message = "AI generation request timed out after 3 minutes. The article might be too large or the service is under heavy load.";
      } else if (isTokenLimit) {
        message = "The article is too long for the AI model to process. Try a shorter custom prompt or smaller article.";
      }

      return NextResponse.json({ error: message }, { status: isTimeout ? 504 : 500 });
    }
  } catch (error: any) {
    console.error("AI Generation Payload error:", error);
    return NextResponse.json({ error: "Invalid request or server error" }, { status: 400 });
  }
}
