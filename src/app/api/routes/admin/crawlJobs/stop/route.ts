import { NextResponse } from "next/server";
import {
  crawlJobsService,
  CrawlJobsServiceError,
} from "@/app/api/services/admin/crawlJobs.service";

export async function POST(req: Request) {
  try {
    const { job_id } = await req.json();
    const result = await crawlJobsService.stopJob(String(job_id || ""));
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof CrawlJobsServiceError) {
      return NextResponse.json(
        { error: e.message, ...(e.payload as object) },
        { status: e.status }
      );
    }

    const message = e instanceof Error ? e.message : "Failed to reach stop API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
