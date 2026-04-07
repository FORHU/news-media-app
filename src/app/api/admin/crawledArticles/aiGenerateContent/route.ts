import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveEnglishCategoryId } from "@/lib/categoryMapping";

export const dynamic = "force-dynamic";
//AI persona/instruction
function getAiSystemInstruction(categories: string[]) {
  return `
[FORMATTING RULES]:
- LANGUAGE: You MUST output in English.
- STRUCTURE: Use ONLY these tags:
  <title>Headline</title>
  <category>One choice from: [${categories.join(", ")}]</category>
  <content>The article paragraphs</content>
- STYLE: Use 2-3 sentences per paragraph. Use double newlines (\\n\\n) between paragraphs.
- TONE: Adopt the tone of a professional writer (clear, engaging, and objective).
- FORBIDDEN: Do not use intro phrases like "Certainly!" or "Here is the article". 
- FORBIDDEN WORDS: Do not use AI-cliches: "tapestry", "delve", "unlocking", "moreover", "furthermore", "in conclusion".
- BAN: No markdown, no bolding, and no non-English characters in the output.
`;
}

// Handles title extraction from the AI response.
function extractArticleData(
  responseText: string | null | undefined,
  rawTitle: string
) {
  if (!responseText) return { title: rawTitle, categoryName: null, content: "" };

  const extractTag = (tag: string) => {
    // Robustly find tags even if AI adds bolding or spaces: e.g. **<title>**
    const regex = new RegExp(`(?:\\*+)?<${tag}>(?:\\*+)?([\\s\\S]*?)(?:\\*+)?</${tag}>(?:\\*+)?`, "i");
    const match = responseText.match(regex);
    return match ? match[1].trim() : null;
  };

  const title = extractTag("title") || rawTitle;
  const categoryName = extractTag("category");
  const content = extractTag("content") || "";

  return { title, categoryName, content };
}

export async function POST(req: NextRequest) {
  let articleId: string | undefined;
  try {
    const body = await req.json();
    articleId = body.articleId;
    const customPrompt = typeof body.generationPrompt === "string" ? body.generationPrompt.trim() : "";

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

    const rawArticle = await prisma.rawArticle.findUnique({
      where: { id: articleId },
    });
    if (!rawArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const sessionRes = await fetch(`${baseUrl}/session-id`);
    if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
    const { session_id } = await sessionRes.json();

    const dbCategories = await prisma.category.findMany();
    const categoryNames = dbCategories.map(c => c.categoryName);
    const instruction = getAiSystemInstruction(categoryNames);

    const aiPayload = {
      user_input: `[SOURCE ARTICLE]:\n${rawArticle.content || "No content provided."}\n\n[FORMATTING RULES]:\n${instruction}\n\n[FINAL TASK]:\n${customPrompt || "Translate this article into English and rewrite it professionally."
        }\n\nCRITICAL: Your entire output MUST strictly follow the language requested in the [FINAL TASK] above. If no specific language was requested, you MUST output in English.`,
      session_id,
      persona_prefix: "NewsLetter",
      raw_article_id: articleId,
      document_context: rawArticle.content,
    };

    console.log("[AI Generate] Sending Payload:", JSON.stringify(aiPayload, null, 2));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    let title = "";
    let content = "";
    let resolvedCategoryId = rawArticle.categoryId;

    try {
      const chatRes = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!chatRes.ok) {
        console.error("[AI Generate] Error Status:", chatRes.status);
        throw new Error(`AI generation service error (Status: ${chatRes.status})`);
      }

      const { response } = await chatRes.json();
      if (!response) throw new Error("AI service returned empty response");

      // Extract parts using the helper
      const extracted = extractArticleData(response, rawArticle.title);
      title = extracted.title;
      content = extracted.content;

      // Resolve Category mapping
      const categoryName = extracted.categoryName;
      if (categoryName) {
        const matchedCategory = dbCategories.find(
          c => c.categoryName.toLowerCase() === categoryName.toLowerCase()
        );
        if (matchedCategory) {
          resolvedCategoryId = matchedCategory.id;
        }
      }

      const user =
        (await prisma.user.findUnique({ where: { email: "admin@newsmedia.app" } })) ||
        (await prisma.user.findFirst());

      if (!user) throw new Error("No system user found for attribution");

      const contentArticle = await prisma.contentArticle.create({
        data: {
          title,
          content,
          status: "pending",
          usersId: user.id,
          categoryId: resolvedCategoryId,
          rawArticleId: rawArticle.id,
          publishDate: new Date(),
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
      const message = isTimeout
        ? "AI generation request timed out after 60s. The AI service may be under heavy load."
        : (error.message || "Failed to generate AI content");

      return NextResponse.json({ error: message }, { status: isTimeout ? 504 : 500 });
    }
  } catch (error: any) {
    console.error("AI Generation Payload error:", error);
    return NextResponse.json({ error: "Invalid request or server error" }, { status: 400 });
  }
}
