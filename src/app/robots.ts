import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// robots() uses headers() to build the sitemap URL — must be force-dynamic.
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host") || "newsicons.com";
  
  // Use https by default in production, http for localhost
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

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

