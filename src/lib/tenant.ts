import { cache } from "react";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { 
  getSiteNameFromDomain, 
  getSiteIconFromDomain, 
  getSiteLogoFromDomain, 
  getSiteDescriptionFromDomain 
} from "./tenant-utils";

const TENANT_DOMAIN_COOKIE = "tenant_domain";

export function normalizeHostToDomain(host: string | null): string | null {
  if (!host) return null;
  // Strip port (e.g. "korea.com:3000" -> "korea.com")
  const noPort = host.split(":")[0] ?? host;
  const lower = noPort.trim().toLowerCase();
  const withoutWww = lower.startsWith("www.") ? lower.slice(4) : lower;
  return withoutWww || null;
}

export function getTenantDomainFromRequest(request: NextRequest): string | null {
  const hostHeader = request.headers.get("host");
  const cookie = request.cookies.get(TENANT_DOMAIN_COOKIE)?.value;
  const host = hostHeader ?? cookie;

  // Default fallback if no host/cookie is found (e.g. local dev without host header)
  if (!host) return "newsicons.com";

  const domain = normalizeHostToDomain(host);

  // Handle localhost in development
  if (domain === "localhost" || domain === "127.0.0.1") {
    return "newsicons.com";
  }

  return domain ?? "newsicons.com";
}

export const resolveTenantIdFromRequest = cache(async (request: NextRequest): Promise<string | null> => {
  const domain = getTenantDomainFromRequest(request);
  if (!domain) return null;

  return resolveTenantIdFromDomain(domain);
});

export { TENANT_DOMAIN_COOKIE };

// Global cache to store tenant ID resolution across requests (react cache only works within one request)
const tenantIdCache: Record<string, string | null> = {};

export const resolveTenantIdFromDomain = cache(async (domain: string): Promise<string | null> => {
  if (!domain) return null;

  const normalized = domain.trim().toLowerCase();
  
  // Check global cache first
  if (normalized in tenantIdCache) {
    return tenantIdCache[normalized];
  }

  const candidates = new Set<string>([normalized]);
  if (normalized.startsWith("www.")) {
    candidates.add(normalized.slice(4));
  } else {
    candidates.add(`www.${normalized}`);
  }

  let resolvedId: string | null = null;
  for (const d of candidates) {
    const tenant = await prisma.tenant.findUnique({
      where: { domain: d },
      select: { id: true },
    });
    if (tenant?.id) {
      resolvedId = tenant.id;
      break;
    }
  }

  // Store in global cache
  tenantIdCache[normalized] = resolvedId;
  return resolvedId;
});

export const getTenantById = cache(async (tenantId: string) => {
  if (!tenantId) return null;
  return await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { domain: true, siteName: true },
  });
});

export {
  getSiteNameFromDomain,
  getSiteIconFromDomain,
  getSiteLogoFromDomain,
  getSiteDescriptionFromDomain
};

