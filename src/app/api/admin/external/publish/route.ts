import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { sendWebhookCallback } from "@/lib/webhook";
import { revalidatePath } from "next/cache";

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
        slug: true,
        publishDate: true,
        sourceType: true,
        status: true,
        tenant: { select: { domain: true } },
        externalSubmission: {
          select: { id: true, externalArticleId: true, callbackUrl: true },
        },
      },
    });

    if (!primary || primary.sourceType !== "EXTERNAL" || primary.status !== "draft") {
      return NextResponse.json({ error: "Article not found or not in draft state." }, { status: 404 });
    }

    // Find all draft translations in the same approval batch via shared publishDate
    const batchDate = primary.publishDate ?? new Date();
    const windowStart = new Date(batchDate.getTime() - BATCH_WINDOW_MS);
    const windowEnd   = new Date(batchDate.getTime() + BATCH_WINDOW_MS);

    const translations = await prisma.contentArticle.findMany({
      where: {
        id: { not: primaryId },
        sourceType: "EXTERNAL",
        status: "draft",
        publishDate: { gte: windowStart, lte: windowEnd },
        externalSubmission: { is: null },
      },
      select: { id: true },
    });

    const allIds = [primaryId, ...translations.map((t) => t.id)];
    const publishDate = new Date();

    await prisma.contentArticle.updateMany({
      where: { id: { in: allIds } },
      data: { status: "published", publishDate },
    });

    console.log(
      `[external/publish] ✅ Published ${allIds.length} article(s) | primary: ${primaryId} | translations: ${translations.length}`
    );

    // Revalidate site pages
    const sourceDomain = primary.tenant?.domain ?? "";
    const JEJU_DOMAINS = ["jejutime.com", "voicejeju.com", "jejuqq.com", "jejujapan.com"];
    for (const domain of JEJU_DOMAINS) {
      try { revalidatePath(`/${domain}`, "page"); } catch { /* non-fatal */ }
    }
    if (primary.slug && sourceDomain) {
      try { revalidatePath(`/${sourceDomain}/article/${primary.slug}`, "page"); } catch { /* non-fatal */ }
    }

    // Send webhook callback now that articles are live
    const sub = primary.externalSubmission;
    if (sub?.callbackUrl) {
      const articleUrl =
        primary.slug && sourceDomain
          ? `https://${sourceDomain}/article/${primary.slug}`
          : undefined;
      const result = await sendWebhookCallback(sub.callbackUrl, {
        externalArticleId: sub.externalArticleId,
        status: "approved",
        articleUrl,
      });
      prisma.externalArticleSubmission
        .update({
          where: { id: sub.id },
          data: {
            callbackStatus: result.success ? "sent" : "failed",
            callbackSentAt: new Date(),
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, published: allIds.length });
  } catch (error) {
    console.error("[admin/external/publish]", error);
    return NextResponse.json({ error: "Failed to publish articles" }, { status: 500 });
  }
}
