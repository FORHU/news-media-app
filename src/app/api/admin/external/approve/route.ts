import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { sendWebhookCallback } from "@/lib/webhook";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

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

    const publishDate = new Date();

    const { count } = await prisma.contentArticle.updateMany({
      where: {
        id: { in: articleIds },
        sourceType: "EXTERNAL",
        status: "pending",
      },
      data: { status: "published", publishDate },
    });

    console.log(`[admin/external/approve] Approved ${count} articles | admin: ${payload.email}`);

    const articles = await prisma.contentArticle.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        slug: true,
        title: true,
        tenant: { select: { domain: true } },
        externalSubmission: {
          select: { id: true, externalArticleId: true, callbackUrl: true },
        },
      },
    });

    for (const article of articles) {
      const domain = article.tenant?.domain;
      if (domain) {
        try {
          revalidatePath(`/${domain}`, "page");
          if (article.slug) revalidatePath(`/${domain}/article/${article.slug}`, "page");
        } catch { /* non-fatal */ }
      }

      const sub = article.externalSubmission;
      if (sub?.callbackUrl) {
        const articleUrl = article.slug && domain
          ? `https://${domain}/article/${article.slug}`
          : undefined;
        const result = await sendWebhookCallback(sub.callbackUrl, {
          externalArticleId: sub.externalArticleId,
          status: "approved",
          articleUrl,
        });
        prisma.externalArticleSubmission.update({
          where: { id: sub.id },
          data: {
            callbackStatus: result.success ? "sent" : "failed",
            callbackSentAt: new Date(),
          },
        }).catch(() => { /* non-fatal */ });
      }
    }

    return NextResponse.json({ success: true, approved: count });
  } catch (error) {
    console.error("[admin/external/approve]", error);
    return NextResponse.json({ error: "Failed to approve articles" }, { status: 500 });
  }
}
