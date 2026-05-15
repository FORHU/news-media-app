import { getSiteNameFromDomain, getSiteDescriptionFromDomain } from "@/lib/tenant";

export const getSiteConfig = (domain: string | null) => {
  const baseUrl = domain 
    ? `https://${domain}` 
    : (process.env.SITE_URL || "https://www.newsicons.com").replace(/\/$/, "");

  return {
    url: baseUrl,
    title: getSiteNameFromDomain(domain),
    description: getSiteDescriptionFromDomain(domain),
    ogImage: `${baseUrl}/Logo/NEWSICONSLOGO.png`,
  };
};

// Legacy defaults for backward compatibility where domain context is unavailable
export const SITE_URL = (process.env.SITE_URL || "https://www.newsicons.com").replace(/\/$/, "");
export const DEFAULT_SEO = {
  title: "NewsIcons",
  description: "Media & Content Hub for curated news, blogs, and insights.",
};
export const DEFAULT_OG_IMAGE = `${SITE_URL}/Logo/NEWSICONSLOGO.png`;



