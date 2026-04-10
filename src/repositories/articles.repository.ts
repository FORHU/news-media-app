import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";
import { CATEGORY_HIERARCHY } from "@/lib/categories";
import { Prisma } from "@/generated/prisma/client";

export const articlesRepository = {
  async findMany(params: {
    limit: number;
    search?: string | null;
    category?: string | null;
    status?: string | null;
  }): Promise<Article[]> {
    const { limit, search, category, status } = params;

    const and: Prisma.ContentArticleWhereInput[] = [];

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
      // Check if this is a parent category from our taxonomy
      const parentCategory = CATEGORY_HIERARCHY.find(group => group.label === category);
      
      if (parentCategory) {
        // If it's a parent, include all its subcategories
        and.push({
          category: {
            categoryName: {
              in: [parentCategory.label, ...parentCategory.subcategories]
            }
          }
        });
      } else {
        // Otherwise, filter by the specific name
        and.push({
          category: { categoryName: category },
        });
      }
    }

    if (status) {
      and.push({
        status: status,
      });
    }

    return prisma.contentArticle.findMany({
      take: limit,
      where:
        and.length > 0
          ? { AND: and }
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

