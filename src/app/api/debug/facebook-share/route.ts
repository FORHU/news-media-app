import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      domain?: string;
      pageUrl?: string;
      facebookSharerUrl?: string;
      articleId?: string;
    };

    const domain = (body.domain ?? "").toLowerCase().trim();
    const isTenantDomain =
      domain === "jejutime.com" ||
      domain === "jejuqq.com" ||
      domain === "jejujapan.com";
    const pageUrl = body.pageUrl ?? "";
    const sharerUrl = body.facebookSharerUrl ?? "";

    let hostname = "";
    let protocol = "";
    let port = "";
    try {
      const parsed = new URL(pageUrl);
      hostname = parsed.hostname.toLowerCase();
      protocol = parsed.protocol;
      port = parsed.port;
    } catch {
      // Keep defaults if URL cannot be parsed.
    }

    const isLocalhostLike =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local") ||
      (protocol === "http:" && port === "3000");

    if (isTenantDomain) {
      console.log(
        `[Facebook Share Tenant] domain=${domain} articleId=${body.articleId ?? ""}`,
        `pageUrl=${pageUrl}`,
        `sharerUrl=${sharerUrl}`
      );
    }

    // Localhost diagnostics for quick terminal verification.
    console.log(
      `[Facebook Share Localhost Test] host=${hostname || "unknown"} protocol=${protocol || "unknown"} port=${port || "none"} result=${
        isLocalhostLike ? "LOCAL_ONLY_NOT_CRAWLABLE" : "PUBLIC_CRAWLABLE"
      }`
    );

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : error;
    console.error("[Facebook Share] debug route error:", message);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

