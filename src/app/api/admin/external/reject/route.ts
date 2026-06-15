import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { externalArticlesService } from "@/services/admin/externalArticles.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || (payload.role !== "admin" && payload.role !== "moderator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleIds, reason } = await req.json();
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: "articleIds is required" }, { status: 400 });
    }

    const reasonStr = typeof reason === "string" && reason.trim() ? reason.trim() : undefined;
    const rejected = await externalArticlesService.reject(articleIds, reasonStr);

    console.log(`[admin/external/reject] Rejected ${rejected} articles | admin: ${payload.email}`);
    return NextResponse.json({ success: true, rejected });
  } catch (error) {
    console.error("[admin/external/reject]", error);
    return NextResponse.json({ error: "Failed to reject articles" }, { status: 500 });
  }
}
