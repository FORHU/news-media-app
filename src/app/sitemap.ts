import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { articlesService } from "@/services/articles.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const articles = await articlesService.getArticles({ limit: 100 });

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/article/${article.id}`,
    lastModified: article.updatedAt ?? article.createdAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages];
}

