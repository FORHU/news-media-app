import { prisma } from "@/lib/db";
import type { RawArticle } from "@/lib/types";

export const rawArticlesRepository = {
  async findMany(): Promise<RawArticle[]> {
    return prisma.rawArticle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        crawledUrl: true,
        sourceCite: true,
      },
    }) as Promise<RawArticle[]>;
  },
};

