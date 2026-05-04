import type { MetadataRoute } from "next";
import { headers } from "next/headers";
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

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // Fetch articles specific to this domain/tenant
  const articles = tenantId
    ? await articlesService.getArticles({ limit: 500, status: "published" }, tenantId)
    : [];

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/article/${article.slug ?? article.id}`,
    lastModified: article.updatedAt ?? article.createdAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages];
}

