import { NextRequest, NextResponse } from "next/server";
import { instagramPublishingService } from "@/services/admin/instagramPublishing.service";
import { instagramArticlesQuerySchema } from "@/lib/validation/instagramPublishing";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = instagramArticlesQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({
        articles: [],
        pagination: { total: 0, page: parsed.data.page, limit: parsed.data.limit, totalPages: 0 },
      });
    }

    const result = await instagramPublishingService.listPublishable(tenantId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin/instagram/articles] Error:", error);
    return NextResponse.json({ error: "Failed to fetch publishable articles" }, { status: 500 });
  }
}
