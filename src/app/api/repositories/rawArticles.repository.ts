import { prisma } from "@/lib/db";

export const rawArticlesRepository = {
  async findMany() {
    return prisma.rawArticle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        crawledUrl: true,
        category: true,
        sourceCite: true,
      },
    });
  },
};

