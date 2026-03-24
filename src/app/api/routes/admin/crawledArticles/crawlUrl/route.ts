import { NextResponse } from "next/server";
import {
  crawledArticlesService,
  CrawledArticlesServiceError,
  type TriggerCrawlParams,
} from "@/app/api/services/admin/crawledArticles.service";

export async function POST(req: Request) {
  let body: TriggerCrawlParams;

  try {
    body = (await req.json()) as TriggerCrawlParams;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

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
