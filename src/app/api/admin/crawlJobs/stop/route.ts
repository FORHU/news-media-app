import { NextResponse } from "next/server";

const CRAWL_STOP_API_URL = "http://rckgck80kk8kg40ok4coc8ck.158.178.241.113.sslip.io/stop";

export async function POST(req: Request) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    const upstream = await fetch(CRAWL_STOP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
        return NextResponse.json({ 
            error: data?.error || data?.message || `Upstream error (${upstream.status})`,
            upstream: data 
        }, { status: 502 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to reach stop API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
