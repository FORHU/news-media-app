import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BATCH_WINDOW_MS = 10_000;

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || (payload.role !== "admin" && payload.role !== "moderator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId, title, content, imageUrl } = await req.json();
    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const article = await prisma.contentArticle.findUnique({
      where: { id: articleId },
      select: { id: true, sourceType: true, publishDate: true },
    });

    if (!article || article.sourceType !== "EXTERNAL") {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    // Update title + content for this specific article (each language has its own copy)
    await prisma.contentArticle.update({
      where: { id: articleId },
      data: { title: title.trim(), content: content.trim() },
    });

    // If imageUrl is provided, propagate it to all articles in the same batch
    if (typeof imageUrl === "string" && article.publishDate) {
      const windowStart = new Date(article.publishDate.getTime() - BATCH_WINDOW_MS);
      const windowEnd   = new Date(article.publishDate.getTime() + BATCH_WINDOW_MS);

      await prisma.contentArticle.updateMany({
        where: {
          sourceType: "EXTERNAL",
          publishDate: { gte: windowStart, lte: windowEnd },
        },
        data: { imageUrl: imageUrl.trim() || null },
      });

      console.log(`[external/update] Updated article + batch image | id: ${articleId} | user: ${payload.email}`);
    } else {
      console.log(`[external/update] Updated article | id: ${articleId} | user: ${payload.email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/external/update]", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}
