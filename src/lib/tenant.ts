import { cache } from "react";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

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
  const cookie = request.cookies.get(TENANT_DOMAIN_COOKIE)?.value;
  const host = cookie ?? request.headers.get("host");

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

export const resolveTenantIdFromDomain = cache(async (domain: string): Promise<string | null> => {
  if (!domain) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { domain },
    select: { id: true },
  });
  return tenant?.id ?? null;
});

export function getSiteNameFromDomain(domain: string | null): string {
  if (!domain) return "NewsIcons";
  const d = domain.toLowerCase();
  if (d.includes('jejujapan')) return "Jeju Japan";
  if (d.includes('jejuqq')) return "Jeju QQ";
  if (d.includes('jejutime')) return "Jeju Times";
  return "NewsIcons";
}

