import type { PrismaClient } from "../../src/generated/prisma/client";

const crawledUrls = [
  { url: "https://example.com/news/tech-2024", status: "crawled" },
  { url: "https://example.com/news/climate-2024", status: "crawled" },
  { url: "https://example.com/news/health-2024", status: "crawled" },
  { url: "https://example.com/news/science-2024", status: "crawled" },
];

export async function seedCrawledUrls(
  prisma: PrismaClient,
  tenantId: string
): Promise<string[]> {
  const ids: string[] = [];
  for (const c of crawledUrls) {
    const existing = await prisma.crawledUrl.findUnique({
      where: {
        tenantId_url: {
          tenantId,
          url: c.url,
        },
      },
    });
    if (existing) {
      ids.push(String(existing.id));
    } else {
      const created = await prisma.crawledUrl.create({
        data: { tenantId, url: c.url, status: c.status },
      });
      ids.push(String(created.id));
    }
  }
  return ids;
}
