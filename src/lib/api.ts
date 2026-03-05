import type { Article } from "./types";

export const articlesApi = {
  async getArticles(params?: { limit?: number; search?: string }): Promise<Article[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await fetch(`/api/routes/articles${qs}`);
    if (!res.ok) throw new Error("Failed to fetch articles");
    return res.json();
  },

  async getArticle(id: string): Promise<Article> {
    const res = await fetch(`/api/routes/articles/${id}`);
    if (!res.ok) throw new Error("Failed to fetch article");
    return res.json();
  },
};
