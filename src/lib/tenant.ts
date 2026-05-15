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

export function getSiteNameFromDomain(domain: string | null): string {
  if (!domain) return "NewsIcons";
  const d = domain.toLowerCase();
  if (d.includes('voicejeju')) return "VoiceJeju";
  if (d.includes('jejujapan')) return "JejuJapan";
  if (d.includes('jejuqq')) return "JejuQQ";
  if (d.includes('jejutime')) return "JejuTime";
  return "NewsIcons";
}

export function getSiteIconFromDomain(domain: string | null): string {
  if (!domain) return "/icons/newsicons.ico";
  const d = domain.toLowerCase();
  if (d.includes('voicejeju')) return "/icons/voicejeju.ico";
  if (d.includes('jejujapan')) return "/icons/jejujapan.ico";
  if (d.includes('jejuqq')) return "/icons/jejuqq.ico";
  if (d.includes('jejutime')) return "/icons/jejutime.ico";
  return "/icons/newsicons.ico";
}

export function getSiteLogoFromDomain(domain: string | null): string {
  if (!domain) return "NEWSICONSLOGO.png";
  const d = domain.toLowerCase();
  if (d.includes('voicejeju')) return "VOICEJEJULOGO.png";
  if (d.includes('jejujapan')) return "JEJUJAPANLOGO.png";
  if (d.includes('jejuqq')) return "JEJUQQLOGO.png";
  if (d.includes('jejutime')) return "JEJUTIMELOGO.png";
  return "NEWSICONSLOGO.png";
}

export function getSiteDescriptionFromDomain(domain: string | null): string {
  if (!domain) return "Media & Content Hub for curated news, blogs, and insights.";
  const d = domain.toLowerCase();
  if (d.includes('voicejeju')) return "Your voice for Jeju news, culture, and community insights.";
  if (d.includes('jejujapan')) return "The latest news and insights about Jeju from a Japanese perspective.";
  if (d.includes('jejuqq')) return "Connecting the Jeju community with real-time news and updates.";
  if (d.includes('jejutime')) return "Timely news and in-depth reporting from across Jeju Island.";
  return "Media & Content Hub for curated news, blogs, and insights.";
}

