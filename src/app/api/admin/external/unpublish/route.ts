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

    const { articleIds } = await req.json();
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: "articleIds is required" }, { status: 400 });
    }

    const primaryId = articleIds[0];

    const primary = await prisma.contentArticle.findUnique({
      where: { id: primaryId },
      select: {
        id: true,
        publishDate: true,
        sourceType: true,
        status: true,
        externalSubmission: { select: { id: true } },
      },
    });

    if (!primary || primary.sourceType !== "EXTERNAL" || primary.status !== "published") {
      return NextResponse.json({ error: "Article not found or not unpublishable." }, { status: 404 });
    }

    // Shared draft timestamp so all articles fall into the same 10-second grouping bucket
    const draftDate = new Date();

    // Primary article (has externalSubmission) — reset the whole batch to draft
    if (primary.externalSubmission && primary.publishDate) {
      const windowStart = new Date(primary.publishDate.getTime() - BATCH_WINDOW_MS);
      const windowEnd   = new Date(primary.publishDate.getTime() + BATCH_WINDOW_MS);

      const translations = await prisma.contentArticle.findMany({
        where: {
          id: { not: primaryId },
          sourceType: "EXTERNAL",
          status: "published",
          publishDate: { gte: windowStart, lte: windowEnd },
          externalSubmission: { is: null },
        },
        select: { id: true },
      });

      const allIds = [primaryId, ...translations.map((t) => t.id)];

      await prisma.contentArticle.updateMany({
        where: { id: { in: allIds } },
        data: { status: "draft", publishDate: draftDate },
      });

      console.log(
        `[external/unpublish] Reset ${allIds.length} article(s) to draft | primary: ${primaryId} | translations: ${translations.length}`
      );

      return NextResponse.json({ success: true, unpublished: allIds.length });
    }

    // Single translation sub-row — reset to draft
    await prisma.contentArticle.update({
      where: { id: primaryId },
      data: { status: "draft", publishDate: draftDate },
    });

    console.log(`[external/unpublish] Reset single article to draft | id: ${primaryId}`);

    return NextResponse.json({ success: true, unpublished: 1 });
  } catch (error) {
    console.error("[admin/external/unpublish]", error);
    return NextResponse.json({ error: "Failed to unpublish articles" }, { status: 500 });
  }
}
