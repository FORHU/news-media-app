import type { PrismaClient } from "../../src/generated/prisma/client";
import { articles } from "./articles";

export async function seedRawArticles(
  prisma: PrismaClient,
  categoryMap: Record<string, string>,
  crawledUrlIds: string[]
): Promise<string[]> {
  const statuses = ["generated", "pending", "processing"] as const;
  const count = Math.min(4, articles.length);
  const rawArticleIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const categoryId = categoryMap[articles[i].categoryName];
    if (categoryId == null) continue;
    const crawledUrlId = crawledUrlIds[i % crawledUrlIds.length];
    const created = await prisma.rawArticle.create({
      data: {
        crawledUrl: { connect: { id: crawledUrlId } },
        category: { connect: { id: categoryId } },
        title: `Raw: ${articles[i].title.slice(0, 50)}`,
        author: i % 2 === 0 ? "Staff Writer" : null,
        content: articles[i].content.slice(0, 200) + "...",
        imageUrl: articles[i].imageUrl,
        status: statuses[i % statuses.length],
      } as unknown as Parameters<PrismaClient["rawArticle"]["create"]>[0]["data"],
    });
    rawArticleIds.push(String(created.id));
  }
  return rawArticleIds;
}
