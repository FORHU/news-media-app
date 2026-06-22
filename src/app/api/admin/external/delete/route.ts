import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { externalArticlesService, ExternalArticlesServiceError } from "@/services/admin/externalArticles.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || (payload.role !== "admin" && payload.role !== "moderator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId } = await req.json();
    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    const deleted = await externalArticlesService.delete(articleId);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    if (error instanceof ExternalArticlesServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/external/delete]", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
