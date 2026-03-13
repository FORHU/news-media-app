import type { Article, CrawledArticlesResponse } from "./types";

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

  async getCrawledArticles(params: {
    source?: string;
    date?: string;
    q?: string;
    page: number;
    limit: number;
  }): Promise<CrawledArticlesResponse> {
    const searchParams = new URLSearchParams();
    if (params.source) searchParams.append("source", params.source);
    if (params.date) searchParams.append("date", params.date);
    if (params.q) searchParams.append("q", params.q);
    searchParams.append("page", params.page.toString());
    searchParams.append("limit", params.limit.toString());

    const res = await fetch(`/api/admin/crawledArticles?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch crawled articles");
    return res.json();
  },
};
