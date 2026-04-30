import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";
import { Prisma } from "@/generated/prisma/client";
import { getCategoryFilterVariants } from "@/config/categories";

export const articlesRepository = {
  async findMany(params: {
    limit: number;
    search?: string | null;
    category?: string | null;
    status?: string | null;
    tenantId?: string;
  }): Promise<Article[]> {
    const { limit, search, category, status, tenantId } = params;

    const and: Prisma.ContentArticleWhereInput[] = [];
    if (tenantId) and.push({ tenantId });

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
      const categoryVariants = getCategoryFilterVariants(category);
      and.push({
        OR: categoryVariants.map((name) => ({
          category: {
            categoryName: { equals: name, mode: "insensitive" },
          },
        })),
      });
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
      orderBy: [
        { publishDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" }
      ],
      include: { category: true },
    }) as Promise<Article[]>;
  },

  async findById(id: string, tenantId?: string | null): Promise<Article | null> {
    const where = tenantId ? { id, tenantId } : { id };
    return (await prisma.contentArticle.findFirst({
      where: where as any,
      include: { category: true },
    })) as Article | null;
  },

  async findBySlug(slug: string, tenantId?: string | null): Promise<Article | null> {
    try {
      return (await prisma.contentArticle.findFirst({
        where: tenantId ? ({ slug, tenantId } as any) : ({ slug } as any),
        include: { category: true },
      })) as Article | null;
    } catch {
      // Temporary compatibility fallback when Prisma client
      // has not been regenerated with the slug field yet.
      console.warn("Slug lookup unavailable in Prisma client. Falling back to id lookup.");
      return null;
    }
  },

  async findBySlugOrId(
    identifier: string,
    tenantId?: string | null
  ): Promise<Article | null> {
    const bySlug = await this.findBySlug(identifier, tenantId);
    if (bySlug) {
      return bySlug;
    }

    return this.findById(identifier, tenantId);
  },
};

