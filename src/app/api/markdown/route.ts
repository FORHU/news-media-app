import { NextRequest, NextResponse } from "next/server";
import { estimateTokens, htmlToMarkdown } from "@/lib/htmlToMarkdown";

export const dynamic = "force-dynamic";

/**
 * Internal target of the proxy's `Accept: text/markdown` rewrite.
 * Fetches the normal HTML page from this same server (same Host, so tenant
 * resolution is identical) and returns it converted to Markdown.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  // Only same-server, public page paths.
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/api") || path.startsWith("/admin")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const host = request.headers.get("host") ?? "localhost";
  const port = process.env.PORT || "3000";
  const upstream = await fetch(`http://127.0.0.1:${port}${path}`, {
    headers: { Host: host, Accept: "text/html", "User-Agent": request.headers.get("user-agent") ?? "markdown-negotiation" },
    redirect: "manual",
    cache: "no-store",
  }).catch(() => null);

  const vary = { Vary: "Accept" };
  if (!upstream) return new NextResponse("Upstream unavailable", { status: 502, headers: vary });
  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location");
    return new NextResponse(null, { status: upstream.status, headers: { ...vary, ...(location ? { Location: location } : {}) } });
  }
  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return new NextResponse("Not available as markdown", { status: 406, headers: vary });
  }

  const markdown = htmlToMarkdown(await upstream.text());
  return new NextResponse(markdown, {
    status: upstream.status,
    headers: {
      ...vary,
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(estimateTokens(markdown)),
      "Cache-Control": upstream.headers.get("cache-control") ?? "public, max-age=0, must-revalidate",
    },
  });
}
