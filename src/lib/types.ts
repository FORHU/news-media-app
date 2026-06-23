import type { Prisma } from "@/generated/prisma/client";

// Infer Article type directly from Prisma ContentArticle with category include
export type Article = Prisma.ContentArticleGetPayload<{
  include: {
    category: true;
    user: { select: { firstName: true; lastName: true } };
    rawArticle: {
      include: {
        category: true;
        crawledUrl: true;
      };
    };
    rawVideo: true;
    rawSourceUpload: true;
    rawTweet: {
      select: {
        tweetId: true;
        generationMode: true;
        profileUrl: true;
      };
    };
  };
}>;



export interface MappedRawArticle {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  publishDate: string | Date | null;
  createdAt: string | Date;
  status: string;
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
export interface CrawlJob {
  id: string;
  status: string;
  urls: string[];
  maxArticlesRequest: number;
  articlesSaved: number;
  createdAt: string | Date;
  startedAt: string | Date | null;
  finishedAt: string | Date | null;
}

export interface CrawlJobsResponse {
  jobs: CrawlJob[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string | Date;
}

export type Tenant = Prisma.TenantGetPayload<object>;
