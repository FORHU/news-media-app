import { NextRequest, NextResponse } from "next/server";
import {
  crawledArticlesService,
  CrawledArticlesServiceError,
} from "@/services/admin/crawledArticles.service";
import { crawlTriggerBodySchema } from "@/lib/validation/crawl";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { sseBroadcaster } from "@/lib/sse";

export async function POST(req: NextRequest) {
  const tenantId = await resolveTenantIdFromRequest(req);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = crawlTriggerBodySchema.safeParse({
    ...(json as any),
    // Map frontend's max_requests_per_crawl to the new max_articles field
    max_articles: (json as any)?.max_articles ?? (json as any)?.max_requests_per_crawl,
    tenant_id: tenantId,
  });
  
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = {
    urls: parsed.data.urls,
    tenant_id: parsed.data.tenant_id,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    max_articles: parsed.data.max_articles,
  };

  try {
    const result = await crawledArticlesService.triggerCrawl(body);
    sseBroadcaster.broadcast("crawlJobs:updated");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof CrawledArticlesServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.payload as object) },
        { status: error.status }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to reach crawl API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

