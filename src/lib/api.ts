import { z } from "zod";
import type { Article, CrawledArticlesResponse, CrawlJobsResponse } from "./types";

const articlesParamsSchema = z.object({
  limit: z.number().optional(),
  search: z.string().optional(),
});

const crawledArticlesParamsSchema = z.object({
  source: z.string().optional(),
  date: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  page: z.number(),
  limit: z.number(),
});

export const articlesApi = {
  async getArticles(params?: z.infer<typeof articlesParamsSchema>): Promise<Article[]> {
    const validated = articlesParamsSchema.parse(params ?? {});
    const searchParams = new URLSearchParams();
    if (validated.limit) searchParams.append("limit", validated.limit.toString());
    if (validated.search) searchParams.append("search", validated.search);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await fetch(`/api/articles${qs}`);
    if (!res.ok) throw new Error("Failed to fetch articles");
    return res.json();
  },

  async getArticle(id: string): Promise<Article> {
    const res = await fetch(`/api/articles/${id}`);
    if (!res.ok) throw new Error("Failed to fetch article");
    return res.json();
  },

  async getCrawledArticles(params: z.infer<typeof crawledArticlesParamsSchema>): Promise<CrawledArticlesResponse> {
    const validated = crawledArticlesParamsSchema.parse(params);
    const searchParams = new URLSearchParams();
    if (validated.source) searchParams.append("source", validated.source);
    if (validated.date) searchParams.append("date", validated.date);
    if (validated.from) searchParams.append("from", validated.from);
    if (validated.to) searchParams.append("to", validated.to);
    if (validated.q) searchParams.append("q", validated.q);
    searchParams.append("page", validated.page.toString());
    searchParams.append("limit", validated.limit.toString());

    const res = await fetch(`/api/admin/crawledArticles?${searchParams.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch crawled articles");
    return res.json();
  },

  async getCrawlJobs(params: {
    page: number;
    limit: number;
  }): Promise<CrawlJobsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append("page", params.page.toString());
    searchParams.append("limit", params.limit.toString());

    const res = await fetch(`/api/admin/crawlJobs?${searchParams.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch crawl jobs");
    return res.json();
  },

  async stopCrawlJob(jobId: string): Promise<{ ok: boolean }> {
    const res = await fetch("/api/admin/crawlJobs/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Failed to stop crawl job");
    }
    return res.json();
  },

  async generateAiContent(articleId: string): Promise<unknown> {
    const res = await fetch("/api/admin/crawledArticles/aiGenerateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(
        typeof error.error === "string" ? error.error : "Failed to generate AI content"
      );
    }
    return res.json();
  },

  async getGeneratedArticles(params: {
    q?: string;
    page: number;
    limit: number;
    category?: string;
  }): Promise<{
    articles: Article[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append("q", params.q);
    if (params.category) searchParams.append("category", params.category);
    searchParams.append("page", params.page.toString());
    searchParams.append("limit", params.limit.toString());

    const res = await fetch(`/api/admin/generatedArticles?${searchParams.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch generated articles");
    return res.json();
  },
};
