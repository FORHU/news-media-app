import type { Prisma } from "@/generated/prisma/client";

// Infer Article type directly from Prisma ContentArticle with category include
export type Article = Prisma.ContentArticleGetPayload<{
  include: { category: true };
}>;

export type RawArticle = Prisma.RawArticleGetPayload<{
  include: {
    category: true;
    crawledUrl: true;
    contentArticle: { select: { id: true } };
  };
}>;

export interface MappedRawArticle {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  publishDate: string | Date | null;
  createdAt: string | Date;
  status?: string;
  category: {
    categoryName: string;
  };
  crawledUrl: {
    url: string;
  };
  contentArticle: {
    id: string;
  } | null;
}

export interface CrawledArticlesResponse {
  articles: MappedRawArticle[];
  sources: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
