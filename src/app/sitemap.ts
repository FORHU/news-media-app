import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// sitemap uses headers() to detect the current domain — must be dynamic.
export const dynamic = 'force-dynamic';
import { articlesService } from "@/services/articles.service";
import { normalizeHostToDomain, resolveTenantIdFromDomain } from "@/lib/tenant";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get("host") || "newsicons.com";
  const domain = normalizeHostToDomain(host) || "newsicons.com";
  
  // Use https by default in production, http for localhost
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const tenantId = await resolveTenantIdFromDomain(domain);

  // Fetch articles specific to this domain/tenant
  const articles = tenantId
    ? await articlesService.getArticles({ limit: 500, status: "published" }, tenantId)
    : [];

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
    url: `${baseUrl}/article/${article.slug ?? article.id}`,
    lastModified: article.updatedAt ?? article.publishDate ?? article.createdAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages];
}

