import type { MetadataRoute } from "next";
import { resolveSiteFromRequest } from "@/lib/siteRequest";

// robots() builds URLs from the resolved tenant domain — must be dynamic.
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { baseUrl, tenantId, isLocal } = await resolveSiteFromRequest();

  // Unknown Host (not one of our tenants, not local dev): return a minimal
  // deny-all instead of a crawlable robots.txt that could be cache-poisoned
  // and served for a real domain.
  if (!tenantId && !isLocal) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*"],
      },
      {
        userAgent: ["facebookexternalhit", "Facebot", "Twitterbot", "LinkedInBot", "Slackbot", "WhatsApp", "TelegramBot", "Googlebot", "Bingbot"],
        allow: "/",
      },
      {
        // AI search / answer engines — explicitly allowed so the sites are
        // eligible to be cited in AI results (GEO). Flip to `disallow: "/"`
        // per-agent to opt out of a specific crawler.
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "Perplexity-User",
          "ClaudeBot",
          "Claude-User",
          "Claude-SearchBot",
          "anthropic-ai",
          "Google-Extended",
          "Applebot",
          "Applebot-Extended",
          "Amazonbot",
          "Bytespider",
          "Meta-ExternalAgent",
          "Meta-ExternalFetcher",
          "cohere-ai",
          "DuckAssistBot",
          "YouBot",
          "CCBot",
        ],
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*"],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`],
    host: baseUrl,
  };
}
