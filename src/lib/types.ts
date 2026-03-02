import type { Prisma } from "@/generated/prisma/client";

// Infer Article type directly from Prisma ContentArticle with category include
export type Article = Prisma.ContentArticleGetPayload<{
  include: { category: true };
}>;

// Raw articles coming from the crawler with useful relations
export type RawArticle = Prisma.RawArticleGetPayload<{
  include: {
    category: true;
    crawledUrl: true;
    sourceCite: true;
  };
}>;
