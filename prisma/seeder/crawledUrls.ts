import type { PrismaClient } from "../../src/generated/prisma/client";

const crawledUrls = [
  { url: "https://example.com/news/tech-2024", status: "crawled" },
  { url: "https://example.com/news/climate-2024", status: "crawled" },
  { url: "https://example.com/news/health-2024", status: "crawled" },
  { url: "https://example.com/news/science-2024", status: "crawled" },
];

export async function seedCrawledUrls(prisma: PrismaClient): Promise<number[]> {
  const ids: number[] = [];
  for (const c of crawledUrls) {
    const existing = await prisma.crawledUrl.findUnique({ where: { url: c.url } });
    if (existing) {
      ids.push(existing.id);
    } else {
      const created = await prisma.crawledUrl.create({
        data: { url: c.url, status: c.status },
      });
      ids.push(created.id);
    }
  }
  return ids;
}
