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

export interface GeneralPublishTarget {
  contentArticleId: string;
  slug: string | null;
  tenantId: string;
  domain: string;
  siteName: string;
  status: string;
}

export interface GeneralPublishBroadcast {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  category: string;
  isHeadline: boolean;
  createdAt: string;
  updatedAt: string;
  status: string;
  targetCount: number;
  /** Sites created after this broadcast that it hasn't reached yet. */
  newTenantCount: number;
  publishedCount: number;
  /** Sites this broadcast failed to reach (no copy was created); each can be retried. */
  failedTargets: { tenantId: string; domain: string; error: string }[];
  targets: GeneralPublishTarget[];
}

export interface GeneralPublishAuditEntry {
  id: string;
  broadcastId: string;
  broadcastTitle: string;
  action:
    | "create"
    | "edit"
    | "publish"
    | "unpublish"
    | "site_publish"
    | "site_unpublish"
    | "sync"
    | "retry"
    | "delete";
  actorEmail: string | null;
  details: {
    reached?: number;
    failures?: { tenantId: string; domain: string; error: string }[];
    domain?: string;
    fields?: string[];
    sites?: number;
  } | null;
  createdAt: string;
}

export interface GeneralPublishesResponse {
  broadcasts: GeneralPublishBroadcast[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
