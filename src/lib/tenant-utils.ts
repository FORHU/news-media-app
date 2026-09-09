/**
 * Client-safe tenant utilities.
 * 
 * These are pure helper functions that rely ONLY on the domain string.
 * They have NO server-only imports (no prisma, no pg, no Node built-ins)
 * and are safe to import from 'use client' components.
 */

export function getSiteNameFromDomain(domain: string | null): string {
  if (!domain) return "NewsIcons";
  const d = domain.toLowerCase();
  if (d.includes('lavaguetech')) return "LavagueTech";
  if (d.includes('voicejeju')) return "VoiceJeju";
  if (d.includes('jejujapan')) return "JejuJapan";
  if (d.includes('jejuqq')) return "JejuQQ";
  if (d.includes('jejutime')) return "JejuTime";
  if (d.includes('skyblueprime')) return "Sky Blue Prime";
  if (d.includes('legalhyper')) return "LegalHyper";
  if (d.includes('linktechnews')) return "LinkTechnews";
  if (d.includes('dbtechnews')) return "DbTechnews";
  if (d.includes('magazinetechy')) return "Magazine Techy";
  if (d.includes('magazineair')) return "Magazine Air";
  if (d.includes('techygate')) return "TechyGate";
  if (d.includes('newyorksignal')) return "New York Signal";
  return "NewsIcons";
}

export function getSiteIconFromDomain(domain: string | null): string {
  if (!domain) return "/icons/newsicons.ico";
  const d = domain.toLowerCase();
  if (d.includes('lavaguetech')) return "/icons/lavaguetech.ico";
  if (d.includes('voicejeju')) return "/icons/voicejeju.ico";
  if (d.includes('jejujapan')) return "/icons/jejujapan.ico";
  if (d.includes('jejuqq')) return "/icons/jejuqq.ico";
  if (d.includes('jejutime')) return "/icons/jejutime.ico";
  if (d.includes('skyblueprime')) return "/icons/skyblueprime.ico";
  if (d.includes('legalhyper')) return "/icons/legalhyper.ico";
  if (d.includes('linktechnews')) return "/icons/linktechnews.ico";
  if (d.includes('dbtechnews')) return "/icons/dbtechnews.ico";
  if (d.includes('magazinetechy')) return "/icons/magazinetechy.ico";
  if (d.includes('magazineair')) return "/icons/magazineair.ico";
  if (d.includes('techygate')) return "/icons/techygate.ico";
  if (d.includes('newyorksignal')) return "/icons/newyorksignal.ico";
  return "/icons/newsicons.ico";
}

export function getSiteLogoFromDomain(domain: string | null): string {
  if (!domain) return "NEWSICONSLOGO.png";
  const d = domain.toLowerCase();
  if (d.includes('lavaguetech')) return "LAVAGUETECH.png";
  if (d.includes('voicejeju')) return "VOICEJEJULOGO.png";
  if (d.includes('jejujapan')) return "JEJUJAPANLOGO.png";
  if (d.includes('jejuqq')) return "JEJUQQLOGO.png";
  if (d.includes('jejutime')) return "JEJUTIMELOGO.png";
  if (d.includes('skyblueprime')) return "NEWSICONSLOGO.png";
  if (d.includes('legalhyper')) return "LEGALHYPERLOGO.png";
  // technews family — theme-derived wordmark PNGs in /public/Logo.
  if (d.includes('linktechnews')) return "LINKTECHNEWS.png";
  if (d.includes('dbtechnews')) return "DBTECHNEWS.png";
  if (d.includes('magazinetechy')) return "MAGAZINETECHY.png";
  if (d.includes('magazineair')) return "MAGAZINEAIR.png";
  if (d.includes('techygate')) return "TECHYGATE.png";
  if (d.includes('newyorksignal')) return "NEWYORKSIGNAL.png";
  return "NEWSICONSLOGO.png";
}

export function getSiteDescriptionFromDomain(domain: string | null): string {
  if (!domain) return "Media & Content Hub for curated news, blogs, and insights.";
  const d = domain.toLowerCase();
  if (d.includes('lavaguetech')) return "The next wave of technology news — sharp insights, bold perspectives.";
  if (d.includes('voicejeju')) return "Your voice for Jeju news, culture, and community insights.";
  if (d.includes('jejujapan')) return "The latest news and insights about Jeju from a Japanese perspective.";
  if (d.includes('jejuqq')) return "Connecting the Jeju community with real-time news and updates.";
  if (d.includes('jejutime')) return "Timely news and in-depth reporting from across Jeju Island.";
  if (d.includes('skyblueprime')) return "Premium news, analysis, and stories — clear reporting for a connected world.";
  if (d.includes('legalhyper')) return "LegalHyper — independent journalism on the AI transforming the practice of law.";
  if (d.includes('linktechnews')) return "The technology wire — every story worth the click, in one feed.";
  if (d.includes('dbtechnews')) return "Infrastructure, data, and the systems that run everything else.";
  if (d.includes('magazinetechy')) return "Long looks at the people and ideas shaping technology.";
  if (d.includes('magazineair')) return "Technology, lightly held. Clear reporting with room to breathe.";
  if (d.includes('techygate')) return "Your gateway to the day in technology.";
  if (d.includes('newyorksignal')) return "Dispatches on technology from the city that never logs off.";
  return "Media & Content Hub for curated news, blogs, and insights.";
}

/**
 * Official brand profiles per domain, emitted as schema.org `sameAs` so search
 * and AI engines can disambiguate the publisher entity. Fill each array in as
 * the accounts exist, e.g.
 *   linktechnews: ["https://x.com/linktechnews",
 *                  "https://www.linkedin.com/company/linktechnews"]
 * An empty array simply omits `sameAs` from the markup.
 */
const SITE_SAME_AS: Record<string, string[]> = {
  newsicons: [],
  lavaguetech: [],
  voicejeju: [],
  jejujapan: [],
  jejuqq: [],
  jejutime: [],
  skyblueprime: [],
  legalhyper: [],
  linktechnews: [],
  dbtechnews: [],
  magazinetechy: [],
  magazineair: [],
  techygate: [],
  newyorksignal: [],
};

export function getSiteSameAsFromDomain(domain: string | null): string[] {
  if (!domain) return [];
  const d = domain.toLowerCase();
  for (const [key, urls] of Object.entries(SITE_SAME_AS)) {
    if (d.includes(key)) return urls;
  }
  return [];
}

/** Jeju site domains default to keeping the crawled thumbnail; others default to OpenAI image remix. */
const KEEP_SOURCE_IMAGE_DOMAIN_MARKERS = ["jejujapan", "jejuqq", "jejutime"] as const;

export function getDefaultGenerateNewImageFromDomain(domain?: string | null): boolean {
  const d = (domain ?? (typeof window !== "undefined" ? window.location.hostname : ""))
    .toLowerCase()
    .trim();
  if (!d) return true;
  return !KEEP_SOURCE_IMAGE_DOMAIN_MARKERS.some((marker) => d.includes(marker));
}
