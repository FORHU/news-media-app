import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type FetchCrawledArticlesParams = {
  source: string;
  from?: string;
  to?: string;
  q: string;
  offset: number;
  limit: number;
  tenantId: string;
  status?: "all" | "generated" | "pending";
};

export const crawledArticlesRepository = {
  async fetchCrawledArticles(params: FetchCrawledArticlesParams) {
    const { source, from, to, q, offset, limit, tenantId, status } = params;

    const where: Prisma.RawArticleWhereInput = {
      tenantId,
    };

    if (from || to) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (from) createdAtFilter.gte = new Date(from);
      if (to) createdAtFilter.lte = new Date(to);
      where.createdAt = createdAtFilter;
    }

    if (source && source !== "All Sources") {
      where.crawledUrl = {
        url: {
          contains: source,
          mode: "insensitive",
        },
      };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }
    
    if (status === "generated") {
      where.contentArticle = { isNot: null };
    } else if (status === "pending") {
      where.contentArticle = { is: null };
    }

    const [data, count] = await Promise.all([
      prisma.rawArticle.findMany({
        where,
        include: {
          category: true,
          crawledUrl: true,
          contentArticle: true,
        },
        orderBy: [
          { createdAt: "desc" },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.rawArticle.count({ where }),
    ]);

    return { data, count };
  },

  async fetchCrawledSources(tenantId: string) {
    const data = await prisma.rawArticle.findMany({
      where: { tenantId },
      select: {
        crawledUrl: {
          select: {
            url: true,
          },
        },
      },
    });

    return data
      .map((item) => item.crawledUrl?.url)
      .filter((url): url is string => typeof url === "string");
  },
  async deleteRawArticle(id: string, tenantId: string) {
    return prisma.rawArticle.delete({
      where: {
        id,
        tenantId,
      },
    });
  },
};
