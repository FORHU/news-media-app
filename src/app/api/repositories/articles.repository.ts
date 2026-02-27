import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";

export const articlesRepository = {
  async findMany(params: { limit: number; search?: string | null }): Promise<Article[]> {
    const { limit, search } = params;

    return prisma.contentArticle.findMany({
      take: limit,
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
              {
                category: {
                  categoryName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }) as Promise<Article[]>;
  },

  async findById(id: number): Promise<Article | null> {
    return (await prisma.contentArticle.findUnique({
      where: { id },
      include: { category: true },
    })) as Article | null;
  },
};

