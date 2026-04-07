import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveEnglishCategoryId } from "@/lib/categoryMapping";

export const dynamic = "force-dynamic";

function getAiSystemInstruction(categories: string[]) {
  return `
[FORMATTING RULES]:
- DEFAULT OUTPUT LANGUAGE: English (Unless the [FINAL TASK] below overrides this).
- MANDATORY FORMAT: Your entire response MUST be structured as:
  <title>Headline</title>
  <category>One choice from: [${categories.join(", ")}]</category>
  <content>The article paragraphs</content>
- No other text, markdown, or commentary.
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
      user_input: `[SOURCE ARTICLE]:\n${rawArticle.content || "No content provided."}\n\n[FORMATTING]:\n${instruction}\n\n[FINAL TASK]:\n${customPrompt || "Rewrite the article professionally."
        }\n\n(Follow the FINAL TASK above strictly, as it overrides any default formatting.)`,
      session_id,
      persona_prefix: "NewsLetter",
      raw_article_id: articleId,
      document_context: rawArticle.content,
    };

    console.log("[AI Generate] Sending Payload:", JSON.stringify(aiPayload, null, 2));

    const chatRes = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiPayload),
    });
    if (!chatRes.ok) throw new Error("AI generation service error during chat");
    const { response } = await chatRes.json();

    // Check for OpenAI/AI service errors that might be returned as strings in the 'response' field
    if (typeof response === "string" && (
      response.includes("Error code:") ||
      response.includes("insufficient_quota") ||
      response.includes("exceeded your current quota")
    )) {
      throw new Error(`AI Provider Error: ${response}`);
    }

    if (!response || response.trim().length === 0) {
      throw new Error("AI Service returned an empty response.");
    }

    const { title, categoryName, content } = extractArticleData(response, rawArticle.title);

    const user =
      (await prisma.user.findUnique({ where: { email: "editor@newsmedia.app" } })) ||
      (await prisma.user.findFirst());
    if (!user) throw new Error("User required for association not found in database");

    // Resolve Category: AI selected first, then fallback to original mapping
    let resolvedCategoryId = await resolveEnglishCategoryId(rawArticle.categoryId);
    if (categoryName) {
      const matchedCategory = dbCategories.find(
        c => c.categoryName.toLowerCase() === categoryName.toLowerCase()
      );
      if (matchedCategory) {
        resolvedCategoryId = matchedCategory.id;
      }
    }

    const contentArticle = await prisma.contentArticle.create({
      data: {
        title,
        content,
        status: "pending",
        usersId: user.id,
        categoryId: resolvedCategoryId,
        rawArticleId: rawArticle.id,
        imageUrl: null,
        publishDate: new Date(),
      },
    });

    await prisma.rawArticle.update({
      where: { id: articleId },
      data: { status: "generated" },
    });

    return NextResponse.json(contentArticle);
  } catch (error: unknown) {
    console.error("AI Generation failed:", error);

    // Attempt to mark raw article as failed
    if (articleId) {
      try {
        await prisma.rawArticle.update({
          where: { id: articleId },
          data: { status: "failed" },
        });
      } catch (dbError) {
        console.error("Failed to update raw article status to failed:", dbError);
      }
    }

    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
