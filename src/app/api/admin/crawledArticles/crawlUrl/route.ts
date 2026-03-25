import { NextResponse } from "next/server";
import {
  crawledArticlesService,
  CrawledArticlesServiceError,
} from "@/services/admin/crawledArticles.service";
import { crawlTriggerBodySchema } from "@/lib/validation/crawl";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = crawlTriggerBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = {
    urls: parsed.data.urls,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    max_requests_per_crawl: parsed.data.max_requests_per_crawl,
  };

  try {
    const result = await crawledArticlesService.triggerCrawl(body);
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

