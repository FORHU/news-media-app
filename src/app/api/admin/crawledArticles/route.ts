import { NextRequest, NextResponse } from "next/server";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";
import {
  crawledArticlesService,
  CrawledArticlesServiceError,
} from "@/services/admin/crawledArticles.service";
import { crawledArticlesQuerySchema } from "@/lib/validation/crawl";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = crawledArticlesQuerySchema.safeParse({
    source: searchParams.get("source") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const result = await crawledArticlesService.getCrawledArticles(parsed.data, tenantId);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("Error fetching crawled articles:", error);

    if (error instanceof CrawledArticlesServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.payload as object) },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

