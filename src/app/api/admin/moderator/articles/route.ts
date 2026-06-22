import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { moderatorService } from "@/services/admin/moderator.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

    const result = await moderatorService.listArticles(payload.sub, page, 10);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[moderator/articles GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
