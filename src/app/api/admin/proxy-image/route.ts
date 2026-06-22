import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    console.error("[proxy-image] Invalid URL:", url);
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    console.error("[proxy-image] Blocked non-http URL:", url);
    return NextResponse.json({ error: "Only http/https URLs are allowed" }, { status: 400 });
  }

  try {
    console.log(`[proxy-image] Fetching: ${url}`);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      console.error(
        `[proxy-image] FAILED — status ${res.status} ${res.statusText}` +
        `\n  URL:            ${url}` +
        `\n  Host:           ${parsed.hostname}` +
        `\n  Content-Type:   ${res.headers.get("content-type") ?? "none"}` +
        `\n  x-amz-request:  ${res.headers.get("x-amz-request-id") ?? "n/a"}` +
        `\n  CF-Ray:         ${res.headers.get("cf-ray") ?? "n/a"}`
      );
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") ?? "";
    const baseType = contentType.split(";")[0].trim();

    if (!ALLOWED_CONTENT_TYPES.includes(baseType)) {
      console.error(
        `[proxy-image] BLOCKED — unexpected content-type "${contentType}"` +
        `\n  URL: ${url}`
      );
      return new NextResponse(null, { status: 415 });
    }

    const buffer = await res.arrayBuffer();
    console.log(`[proxy-image] OK — ${baseType} ${buffer.byteLength} bytes from ${parsed.hostname}`);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": baseType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[proxy-image] FETCH ERROR` +
      `\n  URL:     ${url}` +
      `\n  Host:    ${parsed.hostname}` +
      `\n  Reason:  ${message}`
    );
    return new NextResponse(null, { status: 502 });
  }
}
