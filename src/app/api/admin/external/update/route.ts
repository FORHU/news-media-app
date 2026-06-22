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

    const { articleId, title, content, imageUrl } = await req.json();
    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    await externalArticlesService.update(articleId, { title, content, imageUrl });

    console.log(`[external/update] Updated article | id: ${articleId} | user: ${payload.email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ExternalArticlesServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/external/update]", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}
