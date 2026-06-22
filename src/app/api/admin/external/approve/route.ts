import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { externalArticlesService, ExternalArticlesServiceError } from "@/services/admin/externalArticles.service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

    const baseUrl = (process.env.GENERATE_CONTENT_API ?? "").replace(/\/$/, "");
    if (!baseUrl) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 500 });
    }

    const drafted = await externalArticlesService.approve(articleIds, baseUrl);
    return NextResponse.json({ success: true, drafted });
  } catch (error) {
    if (error instanceof ExternalArticlesServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/external/approve]", error);
    return NextResponse.json({ error: "Failed to approve articles" }, { status: 500 });
  }
}
