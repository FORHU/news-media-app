import { crawlJobsRepository } from "@/repositories/admin/crawlJobs.repository";

const CRAWL_STOP_API_URL = process.env.CRAWL_STOP_API_URL;

export class CrawlJobsServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "CrawlJobsServiceError";
  }
}

function normalizeUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((u) => typeof u === "string" && u.trim());
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
}

export const crawlJobsService = {
  async getJobs(params: { page: number; limit: number; tenantId: string }) {
    const offset = (params.page - 1) * params.limit;


    const { rows, count } = await crawlJobsRepository.fetchJobs({
      offset,
      limit: params.limit,
      tenantId: params.tenantId,
    });

    const jobs = rows.map((job) => ({
      id: job.id,
      status: job.status || "Pending",
      urls: normalizeUrls(job.urls),
      maxArticlesRequest: job.maxArticlesRequest || 0,
      articlesSaved: (job as any)._count?.rawArticles || 0,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    }));

    return {
      jobs,
      pagination: {
        total: count,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(count / params.limit),
      },
    };
  },

  async stopJob(jobId: string) {
    if (!jobId) {
      throw new CrawlJobsServiceError("job_id is required", 400);
    }

    if (!CRAWL_STOP_API_URL) {
      throw new CrawlJobsServiceError(
        "CRAWL_STOP_API_URL environment variable is not configured",
        500
      );
    }

    try {
      const upstream = await fetch(CRAWL_STOP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
        signal: AbortSignal.timeout(10_000),
      });

      const data = await upstream.json().catch(() => null);

      if (!upstream.ok) {
        throw new CrawlJobsServiceError(
          data?.error || data?.message || `Upstream error (${upstream.status})`,
          502,
          { upstream: data }
        );
      }

      return { ok: true, data };
    } catch (error) {
      if (error instanceof CrawlJobsServiceError) throw error;
      const message = error instanceof Error ? error.message : "Failed to reach stop API";
      throw new CrawlJobsServiceError(message, 502);
    }
  },
};

