import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";
import { Prisma } from "@/generated/prisma/client";
import { getCategoryFilterVariants } from "@/config/categories";

// Full include — used by admin operations that need raw source data
const articleInclude = {
  category: true,
  user: { select: { firstName: true, lastName: true } },
  rawArticle: {
    include: {
      category: true,
      crawledUrl: true,
    },
  },
  rawVideo: true,
  rawSourceUpload: true,
  rawTweet: {
    select: {
      tweetId: true,
      generationMode: true,
      profileUrl: true,
    },
  },
} satisfies Prisma.ContentArticleInclude;

// Lightweight include — used for public article pages.
// Omits rawArticle.crawledUrl, rawVideo, and rawSourceUpload which can be
// several MBs and are not needed for rendering. Prevents 413 on Vercel.
const articleDetailInclude = {
  category: true,
  user: { select: { firstName: true, lastName: true } },
  rawArticle: {
    select: {
      id: true,
      category: true,
    },
  },
  rawTweet: {
    select: {
      tweetId: true,
      generationMode: true,
      profileUrl: true,
    },
  },
} satisfies Prisma.ContentArticleInclude;

// Minimal select for listings (landing pages, sidebars, recommended).
// Excludes the massive 'content' field to prevent Vercel oversized ISR page errors.
const articleSummarySelect = {
  id: true,
  tenantId: true,
  usersId: true,
  categoryId: true,
  title: true,
  slug: true,
  publishDate: true,
  imageUrl: true,
  youtubeUrl: true,
  sourceType: true,
  status: true,
  createdAt: true,
  viewCount: true,
  trendingScore: true,
  content: true,
  category: {
    select: {
      id: true,
      categoryName: true,
    },
  },
  user: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.ContentArticleSelect;

export const articlesRepository = {
  async findMany(params: {
    limit: number;
    search?: string | null;
    category?: string | null;
    status?: string | null;
    tenantId?: string;
    onlySummary?: boolean;
  }): Promise<Article[]> {
    const { limit, search, category, status, tenantId, onlySummary } = params;

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
    } else {
      and.push({
        status: { in: ["published", "blog", "article"] },
      });
    }

    const queryOptions: any = {
      take: limit,
      where: and.length > 0 ? { AND: and } : undefined,
      orderBy: [
        { publishDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" }
      ],
    };

    if (onlySummary) {
      queryOptions.select = articleSummarySelect;
    } else {
      queryOptions.include = articleDetailInclude;
    }

    return prisma.contentArticle.findMany(queryOptions) as Promise<Article[]>;
  },

  async findById(id: string, tenantId?: string | null): Promise<Article | null> {
    const where: Prisma.ContentArticleWhereInput = tenantId ? { id, tenantId } : { id };
    where.status = { in: ["published", "blog", "article"] };
    return (await prisma.contentArticle.findFirst({
      where: where as any,
      include: articleDetailInclude,
    })) as Article | null;
  },

  async findBySlug(slug: string, tenantId?: string | null): Promise<Article | null> {
    try {
      const where: Prisma.ContentArticleWhereInput = tenantId ? { slug, tenantId } : { slug };
      where.status = { in: ["published", "blog", "article"] };
      return (await prisma.contentArticle.findFirst({
        where: where as any,
        include: articleDetailInclude,
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

  async incrementViewCount(id: string): Promise<void> {
    const article = await this.findBySlugOrId(id);
    if (!article) return;

    await prisma.contentArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });
  },
};

