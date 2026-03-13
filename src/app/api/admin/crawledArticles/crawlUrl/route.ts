import { NextResponse } from "next/server";

const CRAWL_API_URL = "http://rckgck80kk8kg40ok4coc8ck.158.178.241.113.sslip.io/crawl";

type CrawlRequestBody = {
  urls: string[];
  start_date?: string;
  end_date?: string;
  max_requests_per_crawl?: number;
};

function isIsoDateString(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(req: Request) {
  let body: CrawlRequestBody;
  try {
    body = (await req.json()) as CrawlRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const urls = Array.isArray(body.urls) ? body.urls.filter((u) => typeof u === "string" && u.trim()) : [];
  if (urls.length === 0) {
    return NextResponse.json({ error: "urls is required" }, { status: 400 });
  }

  const payload: CrawlRequestBody = { urls };

  if (isIsoDateString(body.start_date)) payload.start_date = body.start_date;
  if (isIsoDateString(body.end_date)) payload.end_date = body.end_date;

  if (typeof body.max_requests_per_crawl === "number" && Number.isFinite(body.max_requests_per_crawl)) {
    payload.max_requests_per_crawl = Math.max(1, Math.floor(body.max_requests_per_crawl));
  }

  try {
    const upstream = await fetch(CRAWL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Avoid hanging requests in the UI if upstream stalls.
      signal: AbortSignal.timeout(60_000),
    });

    const contentType = upstream.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await upstream.json().catch(() => null) : await upstream.text().catch(() => "");

    if (!upstream.ok) {
      const message =
        (data && typeof data === "object" && ("error" in data || "message" in data) && ((data as any).error || (data as any).message)) ||
        `Upstream error (${upstream.status})`;
      return NextResponse.json({ error: message, upstream_status: upstream.status, upstream: data }, { status: 502 });
    }

    return NextResponse.json({ ok: true, upstream: data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to reach crawl API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

