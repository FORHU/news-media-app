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
  if (d.includes('voicejeju')) return "VoiceJeju";
  if (d.includes('jejujapan')) return "JejuJapan";
  if (d.includes('jejuqq')) return "JejuQQ";
  if (d.includes('jejutime')) return "JejuTime";
  if (d.includes('skyblueprime')) return "Sky Blue Prime";
  return "NewsIcons";
}

export function getSiteIconFromDomain(domain: string | null): string {
  if (!domain) return "/icons/newsicons.ico";
  const d = domain.toLowerCase();
  if (d.includes('voicejeju')) return "/icons/voicejeju.ico";
  if (d.includes('jejujapan')) return "/icons/jejujapan.ico";
  if (d.includes('jejuqq')) return "/icons/jejuqq.ico";
  if (d.includes('jejutime')) return "/icons/jejutime.ico";
  if (d.includes('skyblueprime')) return "/icons/newsicons.ico";
  return "/icons/newsicons.ico";
}

export function getSiteLogoFromDomain(domain: string | null): string {
  if (!domain) return "NEWSICONSLOGO.png";
  const d = domain.toLowerCase();
  if (d.includes('voicejeju')) return "VOICEJEJULOGO.png";
  if (d.includes('jejujapan')) return "JEJUJAPANLOGO.png";
  if (d.includes('jejuqq')) return "JEJUQQLOGO.png";
  if (d.includes('jejutime')) return "JEJUTIMELOGO.png";
  if (d.includes('skyblueprime')) return "NEWSICONSLOGO.png";
  return "NEWSICONSLOGO.png";
}

export function getSiteDescriptionFromDomain(domain: string | null): string {
  if (!domain) return "Media & Content Hub for curated news, blogs, and insights.";
  const d = domain.toLowerCase();
  if (d.includes('voicejeju')) return "Your voice for Jeju news, culture, and community insights.";
  if (d.includes('jejujapan')) return "The latest news and insights about Jeju from a Japanese perspective.";
  if (d.includes('jejuqq')) return "Connecting the Jeju community with real-time news and updates.";
  if (d.includes('jejutime')) return "Timely news and in-depth reporting from across Jeju Island.";
  if (d.includes('skyblueprime')) return "Premium news, analysis, and stories — clear reporting for a connected world.";
  return "Media & Content Hub for curated news, blogs, and insights.";
}
