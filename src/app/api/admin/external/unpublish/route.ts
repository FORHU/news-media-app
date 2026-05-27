import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BATCH_WINDOW_MS = 10_000;

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "admin") {
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

    // Only batch-unpublish when this is the original submission (has externalSubmission)
    if (primary.externalSubmission && primary.publishDate) {
      const windowStart = new Date(primary.publishDate.getTime() - BATCH_WINDOW_MS);
      const windowEnd   = new Date(primary.publishDate.getTime() + BATCH_WINDOW_MS);

      // Find all auto-generated translations in the same publish batch
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

      const translationIds = translations.map((t) => t.id);

      // Delete translations — they were auto-generated and have no original submission
      if (translationIds.length > 0) {
        await prisma.contentArticle.deleteMany({
          where: { id: { in: translationIds } },
        });
        console.log(
          `[external/unpublish] Deleted ${translationIds.length} translation(s) for primary: ${primaryId}`
        );
      }

      // Reset original Korean article to pending
      await prisma.contentArticle.update({
        where: { id: primaryId },
        data: { status: "pending", publishDate: null },
      });

      console.log(`[external/unpublish] Reset primary to pending | id: ${primaryId}`);

      return NextResponse.json({
        success: true,
        unpublished: 1,
        deletedTranslations: translationIds.length,
      });
    }

    // Single article unpublish (translation sub-row or no batch context)
    await prisma.contentArticle.delete({ where: { id: primaryId } });
    console.log(`[external/unpublish] Deleted single translation | id: ${primaryId}`);

    return NextResponse.json({ success: true, unpublished: 1, deletedTranslations: 0 });
  } catch (error) {
    console.error("[admin/external/unpublish]", error);
    return NextResponse.json({ error: "Failed to unpublish articles" }, { status: 500 });
  }
}
