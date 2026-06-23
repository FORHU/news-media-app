import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { moderatorService } from "@/services/admin/moderator.service";

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

    const unpublished = await moderatorService.unpublishArticles(articleIds, payload.email);
    return NextResponse.json({ success: true, unpublished });
  } catch (error: unknown) {
    console.error("[moderator/unpublish] Error:", error);
    return NextResponse.json({ error: "Failed to unpublish articles" }, { status: 500 });
  }
}
