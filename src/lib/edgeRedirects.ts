/**
 * Pure redirect rules used by proxy.ts. No request objects, so they can be unit
 * tested.
 */

function isLocalHost(host: string): boolean {
  return host.includes("localhost") || host.includes("127.0.0.1") || /:\d+$/.test(host);
}

/**
 * Defence in depth for the http:// and www. variants of a tenant host. When a
 * request reaches the app on `www.<host>` or with a visitor scheme of http, send
 * a permanent redirect to https://<apex><same path and query>.
 *
 * The primary place to do this is Cloudflare (see docs/seo-edge-redirects.md);
 * this only covers requests that actually reach the origin. Local dev hosts are
 * never redirected.
 */
export function canonicalHostRedirect(params: {
  host: string | null;
  /** Visitor scheme as reported by the edge (X-Forwarded-Proto / CF-Visitor). */
  proto: string | null;
  pathname: string;
  search: string;
}): string | null {
  const rawHost = (params.host ?? "").trim().toLowerCase();
  if (!rawHost || isLocalHost(rawHost)) return null;

  const hasWww = rawHost.startsWith("www.");
  const apex = hasWww ? rawHost.slice(4) : rawHost;
  const isHttp = (params.proto ?? "").toLowerCase() === "http";
  if (!hasWww && !isHttp) return null;
  if (!apex.includes(".")) return null;

  return `https://${apex}${params.pathname}${params.search}`;
}

/**
 * Visitor scheme as reported by Cloudflare's CF-Visitor header ({"scheme":"http"}).
 *
 * Deliberately NOT X-Forwarded-Proto: Next's own server stamps
 * "x-forwarded-proto: http" on direct (non-proxied) connections and plain
 * reverse proxies often set it to the hop's scheme, so trusting it here could
 * redirect health checks or loop forever. CF-Visitor is only set by Cloudflare
 * and always describes the visitor's request, so an https visit can never be
 * redirected again. Null when the header is absent.
 */
export function visitorScheme(headers: { get(name: string): string | null }): string | null {
  const cfVisitor = headers.get("cf-visitor");
  if (!cfVisitor) return null;
  try {
    const parsed = JSON.parse(cfVisitor) as { scheme?: string };
    return parsed.scheme ?? null;
  } catch {
    return null;
  }
}

/**
 * Legacy homepage category query strings (/?cat=lifestyle, /?category=World)
 * have been crawled as alternate canonicals. Nothing in the app generates them
 * any more; if one arrives, send it to the equivalent search facet (which is
 * noindex,follow) instead of serving a duplicate of the homepage.
 */
export function legacyCategoryRedirect(pathname: string, searchParams: URLSearchParams): string | null {
  if (pathname !== "/") return null;
  const value = (searchParams.get("category") ?? searchParams.get("cat") ?? "").trim();
  if (!value || value.length > 100) return null;
  return `/search?category=${encodeURIComponent(value)}`;
}

/** Paths whose responses must never be indexed. */
export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
