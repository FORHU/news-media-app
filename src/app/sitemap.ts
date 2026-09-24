import type { MetadataRoute } from "next";

// sitemap builds URLs from the resolved tenant domain — must be dynamic.
export const dynamic = 'force-dynamic';
import { unstable_cache } from "next/cache";
import { articlesService } from "@/services/articles.service";
import { resolveSiteFromRequest } from "@/lib/siteRequest";

// Every crawler hit (Google, Bing, AI bots) re-runs this route with no
// caching, which was hammering the shared Supabase connection pool across
// all tenants and causing intermittent GSC "robots.txt unreachable" /
// sitemap fetch failures. A sitemap a few minutes stale is harmless, so
// cache the published-articles query per tenant instead of hitting the DB
// on every single request.
const getCachedPublishedArticles = unstable_cache(
  async (tenantId: string) =>
    articlesService.getArticles({ limit: 500, status: "published" }, tenantId),
  ["sitemap-published-articles"],
  { revalidate: 180 }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { baseUrl, tenantId, isLocal } = await resolveSiteFromRequest();

  // Unknown Host: emit nothing rather than a sitemap pointing at a host we
  // don't control (cache-poisoning guard).
  if (!tenantId && !isLocal) return [];

  // Fetch articles specific to this domain/tenant
  const articles = tenantId ? await getCachedPublishedArticles(tenantId) : [];

  // Homepage lastmod = the freshest article's timestamp. Emitting `new Date()`
  // on every request trains crawlers to distrust the value.
  const articleTimes = articles
    .map((a) =>
      new Date(a.updatedAt ?? a.publishDate ?? a.createdAt ?? 0).getTime()
    )
    .filter((t) => Number.isFinite(t) && t > 0);
  const homeLastModified = articleTimes.length
    ? new Date(Math.max(...articleTimes))
    : new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: homeLastModified,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/article/${encodeURIComponent(article.slug ?? article.id)}`,
    lastModified: article.updatedAt ?? article.publishDate ?? article.createdAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages];
}
