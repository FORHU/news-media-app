import type { Article } from "./types";

export const articlesApi = {
  async getArticles(params?: { limit?: number }): Promise<Article[]> {
    const qs = params?.limit ? `?limit=${params.limit}` : "";
    const res = await fetch(`/api/articles${qs}`);
    if (!res.ok) throw new Error("Failed to fetch articles");
    return res.json();
  },
};

export const adminApi = {
  async initialize(): Promise<void> {
    try {
      await fetch("/api/admin/initialize", { method: "POST" });
    } catch {
      // Ignore - optional init
    }
  },
};
