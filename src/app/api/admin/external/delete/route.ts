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

    const { articleId } = await req.json();
    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    const article = await prisma.contentArticle.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        publishDate: true,
        sourceType: true,
        externalSubmission: { select: { id: true } },
      },
    });

    if (!article || article.sourceType !== "EXTERNAL") {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    // Primary article (has externalSubmission) — delete the whole batch
    if (article.externalSubmission && article.publishDate) {
      const windowStart = new Date(article.publishDate.getTime() - BATCH_WINDOW_MS);
      const windowEnd   = new Date(article.publishDate.getTime() + BATCH_WINDOW_MS);

      const batchArticles = await prisma.contentArticle.findMany({
        where: {
          id: { not: articleId },
          sourceType: "EXTERNAL",
          publishDate: { gte: windowStart, lte: windowEnd },
          externalSubmission: { is: null },
        },
        select: { id: true },
      });

      if (batchArticles.length > 0) {
        await prisma.contentArticle.deleteMany({
          where: { id: { in: batchArticles.map((a) => a.id) } },
        });
      }

      await prisma.contentArticle.delete({ where: { id: articleId } });

      console.log(
        `[external/delete] Deleted primary + ${batchArticles.length} batch article(s) | id: ${articleId}`
      );

      return NextResponse.json({ success: true, deleted: 1 + batchArticles.length });
    }

    // Single article (translation sub-row or no batch context)
    await prisma.contentArticle.delete({ where: { id: articleId } });
    console.log(`[external/delete] Deleted single article | id: ${articleId}`);

    return NextResponse.json({ success: true, deleted: 1 });
  } catch (error) {
    console.error("[admin/external/delete]", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
