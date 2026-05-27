import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { sendWebhookCallback } from "@/lib/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || (payload.role !== "admin" && payload.role !== "moderator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { articleIds, reason } = body;
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: "articleIds is required" }, { status: 400 });
    }

    const { count } = await prisma.contentArticle.updateMany({
      where: {
        id: { in: articleIds },
        sourceType: "EXTERNAL",
        status: "pending",
      },
      data: { status: "rejected" },
    });

    console.log(`[admin/external/reject] Rejected ${count} articles | admin: ${payload.email}`);

    const articles = await prisma.contentArticle.findMany({
      where: { id: { in: articleIds }, sourceType: "EXTERNAL" },
      select: {
        id: true,
        externalSubmission: {
          select: { id: true, externalArticleId: true, callbackUrl: true },
        },
      },
    });

    for (const article of articles) {
      const sub = article.externalSubmission;
      if (!sub?.callbackUrl) continue;
      const result = await sendWebhookCallback(sub.callbackUrl, {
        externalArticleId: sub.externalArticleId,
        status: "rejected",
        reason: typeof reason === "string" && reason.trim() ? reason.trim() : undefined,
      });
      prisma.externalArticleSubmission.update({
        where: { id: sub.id },
        data: {
          callbackStatus: result.success ? "sent" : "failed",
          callbackSentAt: new Date(),
        },
      }).catch(() => { /* non-fatal */ });
    }

    return NextResponse.json({ success: true, rejected: count });
  } catch (error) {
    console.error("[admin/external/reject]", error);
    return NextResponse.json({ error: "Failed to reject articles" }, { status: 500 });
  }
}
