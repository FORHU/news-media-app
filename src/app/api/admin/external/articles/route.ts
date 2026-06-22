import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { externalArticlesService } from "@/services/admin/externalArticles.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || (payload.role !== "admin" && payload.role !== "moderator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "pending";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 6;

    const result = await externalArticlesService.list(status, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin/external/articles GET]", error);
    return NextResponse.json({ error: "Failed to fetch external articles" }, { status: 500 });
  }
}
