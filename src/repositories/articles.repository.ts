import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";

export const articlesRepository = {
  async findMany(params: {
    limit: number;
    search?: string | null;
    category?: string | null;
  }): Promise<Article[]> {
    const { limit, search, category } = params;

    const and: unknown[] = [];

    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
          {
            category: {
              categoryName: { contains: search, mode: "insensitive" },
            },
          },
        ],
      });
    }

    if (category) {
      and.push({
        category: { categoryName: category },
      });
    }

    return prisma.contentArticle.findMany({
      take: limit,
      where:
        and.length > 0
          ? ({ AND: and } as any)
          : undefined,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }) as Promise<Article[]>;
  },

  async findById(id: string): Promise<Article | null> {
    return (await prisma.contentArticle.findUnique({
      where: { id },
      include: { category: true },
    })) as Article | null;
  },
};

