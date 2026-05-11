import { cache } from "react";
import { articlesRepository } from "@/repositories/articles.repository";

export class ArticlesServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ArticlesServiceError";
  }
}

export const articlesService = {
  getArticles: cache(async (params: {
    limit?: number;
    search?: string | null;
    category?: string | null;
    status?: string | null;
    onlySummary?: boolean;
  }, tenantId?: string | null) => {
    const rawLimit = params.limit ?? 50;
    const safeLimit = Math.min(rawLimit || 50, 1000); // Increased limit for sitemaps/etc

    return articlesRepository.findMany({
      limit: safeLimit,
      search: params.search ?? null,
      category: params.category ?? null,
      status: params.status ?? null,
      tenantId: tenantId ?? undefined,
      onlySummary: params.onlySummary,
    });
  }),

  getArticleSummaries: cache(async (params: {
    limit?: number;
    category?: string | null;
    status?: string | null;
  }, tenantId?: string | null) => {
    return articlesRepository.findMany({
      limit: params.limit ?? 10,
      category: params.category ?? null,
      status: params.status ?? "published",
      tenantId: tenantId ?? undefined,
      onlySummary: true,
    });
  }),

  getArticleById: cache(async (id: string, tenantId?: string | null) => {
    if (!id || typeof id !== "string") {
      throw new ArticlesServiceError("Invalid id", 400);
    }

    const article = await articlesRepository.findById(id, tenantId ?? undefined);
    if (!article) {
      throw new ArticlesServiceError("Not found", 404);
    }

    return article;
  }),

  getArticleBySlugOrId: cache(async (identifier: string, tenantId?: string | null) => {
    if (!identifier || typeof identifier !== "string") {
      throw new ArticlesServiceError("Invalid identifier", 400);
    }

    const article = await articlesRepository.findBySlugOrId(identifier, tenantId ?? undefined);
    if (!article) {
      throw new ArticlesServiceError("Not found", 404);
    }

    return article;
  }),

  incrementViewCount: async (id: string) => {
    return articlesRepository.incrementViewCount(id);
  },
};

