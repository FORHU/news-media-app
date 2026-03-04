import type { PrismaClient } from "../../src/generated/prisma/client";
import { articles } from "./articles";

export async function seedRawArticles(
  prisma: PrismaClient,
  contentArticleIds: number[],
  categoryMap: Record<string, number>,
  crawledUrlIds: number[],
  sourceCiteIds: number[]
): Promise<void> {
  const statuses = ["generated", "pending", "processing"] as const;
  const count = Math.min(4, contentArticleIds.length);
  for (let i = 0; i < count; i++) {
    const contentArticleId = contentArticleIds[i];
    const categoryId = categoryMap[articles[i].categoryName];
    if (categoryId == null) continue;
    await prisma.rawArticle.create({
      data: {
        contentArticleId,
        crawledUrlId: crawledUrlIds[i % crawledUrlIds.length],
        categoryId,
        sourceCitesId: sourceCiteIds[i % sourceCiteIds.length],
        title: `Raw: ${articles[i].title.slice(0, 50)}`,
        author: i % 2 === 0 ? "Staff Writer" : null,
        content: articles[i].content.slice(0, 200) + "...",
        imageUrl: articles[i].imageUrl,
        status: statuses[i % statuses.length],
      },
    });
  }
}
