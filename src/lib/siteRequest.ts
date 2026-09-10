import { headers } from "next/headers";
import {
  normalizeHostToDomain,
  resolveTenantIdFromDomain,
  getTenantById,
} from "@/lib/tenant";

export type ResolvedSite = {
  /**
   * Canonical tenant domain taken from the DB (e.g. "linktechnews.com"). Falls
   * back to the requested host only when it is not a known tenant.
   */
  domain: string;
  /** Origin built from `domain` — never echoed from the raw Host header in prod. */
  baseUrl: string;
  /** Tenant id, or null when the request Host is not one of our domains. */
  tenantId: string | null;
  /** True for localhost / 127.0.0.1 / host:port dev requests. */
  isLocal: boolean;
};

/**
 * Reduce a stored domain to bare hostname characters (keeps any `www.`).
 * Guards against dirty `Tenant.domain` data flowing into a base URL.
 */
function cleanDomain(d: string): string {
  return d
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/[^a-z0-9.-]/g, "");
}

/**
 * Resolve the current request's tenant from its Host header, returning a base
 * URL derived from the DB's canonical domain rather than the spoofable header.
 *
 * When `tenantId` is null the Host is not one of our domains. Callers that emit
 * per-domain documents (sitemap, RSS, news sitemap, robots) should return an
 * empty / 404 response in that case instead of echoing the supplied host —
 * otherwise a spoofed `Host:` could poison a cached robots.txt or sitemap.
 */
export async function resolveSiteFromRequest(): Promise<ResolvedSite> {
  const h = await headers();
  const rawHost = h.get("host") || "newsicons.com";
  const isLocal =
    rawHost.includes("localhost") ||
    rawHost.includes("127.0.0.1") ||
    /:\d+$/.test(rawHost);

  // Local dev serves every tenant from localhost:PORT — resolve against the
  // default tenant but keep the localhost origin so links open in the browser.
  if (isLocal) {
    const tenantId = await resolveTenantIdFromDomain("newsicons.com");
    return {
      domain: "newsicons.com",
      baseUrl: `http://${rawHost}`,
      tenantId,
      isLocal: true,
    };
  }

  const requestedDomain = normalizeHostToDomain(rawHost) ?? "newsicons.com";
  const tenantId = await resolveTenantIdFromDomain(requestedDomain);

  if (!tenantId) {
    return {
      domain: requestedDomain,
      baseUrl: `https://${requestedDomain}`,
      tenantId: null,
      isLocal: false,
    };
  }

  const tenant = await getTenantById(tenantId);
  const domain = tenant?.domain ? cleanDomain(tenant.domain) : requestedDomain;
  return {
    domain,
    baseUrl: `https://${domain}`,
    tenantId,
    isLocal: false,
  };
}
