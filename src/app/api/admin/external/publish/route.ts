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

    const { articleIds } = await req.json();
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: "articleIds is required" }, { status: 400 });
    }

    const published = await externalArticlesService.publish(articleIds);
    return NextResponse.json({ success: true, published });
  } catch (error) {
    if (error instanceof ExternalArticlesServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/external/publish]", error);
    return NextResponse.json({ error: "Failed to publish articles" }, { status: 500 });
  }
}
