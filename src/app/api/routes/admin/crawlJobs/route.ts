import { NextRequest, NextResponse } from "next/server";
import {
  crawlJobsService,
  CrawlJobsServiceError,
} from "@/app/api/services/admin/crawlJobs.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const result = await crawlJobsService.getJobs({ page, limit });
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
