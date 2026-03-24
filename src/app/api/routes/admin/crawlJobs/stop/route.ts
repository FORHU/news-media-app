import { NextResponse } from "next/server";
import {
  crawlJobsService,
  CrawlJobsServiceError,
} from "@/app/api/services/admin/crawlJobs.service";
import { crawlJobsStopBodySchema } from "@/lib/validation/crawl";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = crawlJobsStopBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await crawlJobsService.stopJob(parsed.data.job_id);
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
