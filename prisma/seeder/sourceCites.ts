import type { PrismaClient } from "../../src/generated/prisma/client";

const sourceCites = [
  { url: "https://reuters.com/article/123" },
  { url: "https://apnews.com/article/456" },
  { url: "https://bbc.com/news/789" },
  { url: "https://nature.com/articles/abc" },
];

export async function seedSourceCites(prisma: PrismaClient): Promise<string[]> {
  const ids: string[] = [];
  for (const s of sourceCites) {
    const existing = await prisma.sourceCite.findFirst({ where: { url: s.url } });
    if (existing) {
      ids.push(String(existing.id));
    } else {
      const created = await prisma.sourceCite.create({ data: { url: s.url } });
      ids.push(String(created.id));
    }
  }
  return ids;
}
