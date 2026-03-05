import { articlesRepository } from "@/app/api/repositories/articles.repository";

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
  }) {
    const rawLimit = params.limit ?? 50;
    const safeLimit = Math.min(rawLimit || 50, 100);

    return articlesRepository.findMany({
      limit: safeLimit,
      search: params.search ?? null,
    });
  },

  async getArticleById(id: string) {
    if (!id || typeof id !== "string") {
      throw new ArticlesServiceError("Invalid id", 400);
    }

    const article = await articlesRepository.findById(id);
    if (!article) {
      throw new ArticlesServiceError("Not found", 404);
    }

    return article;
  },
};

