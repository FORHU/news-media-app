import { NextRequest, NextResponse } from "next/server";
import {
  crawlJobsService,
  CrawlJobsServiceError,
} from "@/app/api/services/admin/crawlJobs.service";
import { crawlJobsQuerySchema } from "@/lib/validation/crawl";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = crawlJobsQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await crawlJobsService.getJobs(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching crawl jobs:", error);

    if (error instanceof CrawlJobsServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.payload as object) },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch crawl jobs" },
      { status: 500 }
    );
  }
}