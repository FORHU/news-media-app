import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendWebhookCallback } from "@/lib/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleIds } = await req.json();
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: "articleIds is required" }, { status: 400 });
    }

    const publishDate = new Date();

    // Publish all articles by ID — cross-tenant, secured by moderator JWT.
    // Only MANUAL+pending articles are touched to prevent unauthorized publishes.
    const { count } = await prisma.contentArticle.updateMany({
      where: {
        id: { in: articleIds },
        sourceType: { in: ["MANUAL", "EXTERNAL"] },
        status: { in: ["pending", "unpublished"] },
      },
      data: { status: "published", publishDate },
    });

    console.log(
      `[moderator/publish] ✅ Published ${count}/${articleIds.length} articles | moderator: ${payload.email} | ids: [${articleIds.join(", ")}]`
    );

    // Revalidate each article's tenant pages + fire webhooks for EXTERNAL articles
    const articles = await prisma.contentArticle.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        slug: true,
        title: true,
        sourceType: true,
        tenant: { select: { domain: true } },
        externalSubmission: {
          select: { id: true, externalArticleId: true, callbackUrl: true },
        },
      },
    });

    for (const article of articles) {
      const domain = article.tenant?.domain;
      if (!domain) continue;
      try {
        revalidatePath(`/${domain}`, "page");
        revalidatePath(`/${domain}/article/${article.id}`, "page");
        if (article.slug) revalidatePath(`/${domain}/article/${article.slug}`, "page");
        console.log(
          `[moderator/publish] 🔄 Revalidated | domain: ${domain} | id: ${article.id} | title: "${article.title}"`
        );
      } catch { /* non-fatal */ }

      // Send webhook callback for external submissions
      const sub = article.externalSubmission;
      if (article.sourceType === "EXTERNAL" && sub?.callbackUrl) {
        const articleUrl = article.slug
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

    return NextResponse.json({ success: true, published: count });
  } catch (error: any) {
    console.error("[moderator/publish] Error:", error);
    return NextResponse.json({ error: "Failed to publish articles" }, { status: 500 });
  }
}
