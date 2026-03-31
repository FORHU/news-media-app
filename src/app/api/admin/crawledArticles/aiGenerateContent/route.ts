import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Handles title extraction from the AI response.
function extractTitleAndContent(
  responseText: string | null | undefined,
  rawTitle: string
) {
  if (!responseText) return { title: rawTitle, content: "" };

  const lines = responseText.split("\n").filter((l) => l.trim().length > 0);
  const firstLine = lines[0] || "";

  // Clean markdown symbols (#, *) and "Title:" labels from the first line
  const extracted = firstLine
    .replace(/^[\s#*]*(?:Title:\s*)?/i, "")
    .replace(/[\s*#]*$/, "")
    .trim();

  // Logic: Use new title if it's unique and of decent length; otherwise fallback to original
  if (extracted.length > 5 && extracted !== rawTitle) {
    return {
      title: extracted,
      content: lines.slice(1).join("\n\n").trim(), // Double newline for paragraphs
    };
  }

  return { title: rawTitle, content: lines.join("\n\n").trim() }; // Double newline fallback
}

export async function POST(req: NextRequest) {
  let articleId: string | undefined;
  try {
    const body = await req.json();
    articleId = body.articleId;

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

    const chatRes = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_input: `[NewsLetter] ${articleId}`,
        session_id,
      }),
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

    const { title, content } = extractTitleAndContent(response, rawArticle.title);

    const user =
      (await prisma.user.findUnique({ where: { email: "editor@newsmedia.app" } })) ||
      (await prisma.user.findFirst());
    if (!user) throw new Error("User required for association not found in database");

    const contentArticle = await prisma.contentArticle.create({
      data: {
        title,
        content,
        status: "pending",
        usersId: user.id,
        categoryId: rawArticle.categoryId,
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
