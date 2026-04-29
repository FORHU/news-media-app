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
  async getArticles(params: {
    limit?: number;
    search?: string | null;
    category?: string | null;
    status?: string | null;
  }, tenantId?: string | null) {
    const rawLimit = params.limit ?? 50;
    const safeLimit = Math.min(rawLimit || 50, 100);

    return articlesRepository.findMany({
      limit: safeLimit,
      search: params.search ?? null,
      category: params.category ?? null,
      status: params.status ?? null,
      tenantId: tenantId ?? undefined,
    });
  },

  async getArticleById(id: string, tenantId?: string | null) {
    if (!id || typeof id !== "string") {
      throw new ArticlesServiceError("Invalid id", 400);
    }

    const article = await articlesRepository.findById(id, tenantId ?? undefined);
    if (!article) {
      throw new ArticlesServiceError("Not found", 404);
    }

    return article;
  },

  async getArticleBySlugOrId(identifier: string, tenantId?: string | null) {
    if (!identifier || typeof identifier !== "string") {
      throw new ArticlesServiceError("Invalid identifier", 400);
    }

    const article = await articlesRepository.findBySlugOrId(identifier, tenantId ?? undefined);
    if (!article) {
      throw new ArticlesServiceError("Not found", 404);
    }

    return article;
  },
};

