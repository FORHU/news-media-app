import type { Prisma } from "@/generated/prisma/client";

// Infer Article type directly from Prisma ContentArticle with category include
export type Article = Prisma.ContentArticleGetPayload<{
  include: { category: true };
}>;
