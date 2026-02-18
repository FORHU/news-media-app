import type { Article } from "./types";

export const articlesApi = {
  async getArticles(params?: { limit?: number }): Promise<Article[]> {
    const qs = params?.limit ? `?limit=${params.limit}` : "";
    const res = await fetch(`/api/articles${qs}`);
    if (!res.ok) throw new Error("Failed to fetch articles");
    return res.json();
  },

  async getArticle(id: number): Promise<Article> {
    const res = await fetch(`/api/articles/${id}`);
    if (!res.ok) throw new Error("Failed to fetch article");
    return res.json();
  },
};
