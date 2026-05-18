import {
  crawledArticlesRepository,
  type FetchCrawledArticlesParams,
} from "@/repositories/admin/crawledArticles.repository";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import { getValidImageSrc } from "@/lib/image-utils";

const CRAWL_API_URL = process.env.CRAWL_API_URL;

type CrawledArticlesDatePreset =
  | "All Time"
  | "Today"
  | "Last 7 Days"
  | "This Month";

type GetCrawledArticlesParams = {
  source: string;
  date: CrawledArticlesDatePreset;
  from?: string;
  to?: string;
  q: string;
  status: "all" | "generated" | "pending";
  page: number;
  limit: number;
};

type TriggerCrawlParams = {
  urls: string[];
  tenant_id: string;
  start_date?: string;
  end_date?: string;
  max_articles?: number;
};

export class CrawledArticlesServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "CrawledArticlesServiceError";
  }
}

function normalizeDateRange(params: GetCrawledArticlesParams): {
  from?: string;
  to?: string;
} {
  if (params.from || params.to) {
    const range: { from?: string; to?: string } = {};

    if (params.from) {
      const fromStart = new Date(params.from);
      fromStart.setHours(0, 0, 0, 0);
      if (!Number.isNaN(fromStart.getTime())) {
        range.from = fromStart.toISOString();
      }
    }

    if (params.to) {
      const toEnd = new Date(params.to);
      toEnd.setHours(23, 59, 59, 999);
      if (!Number.isNaN(toEnd.getTime())) {
        range.to = toEnd.toISOString();
      }
    }

    return range;
  }

  const now = new Date();

  if (params.date === "Today") {
    return {
      from: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString(),
    };
  }

  if (params.date === "Last 7 Days") {
    return {
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  if (params.date === "This Month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    };
  }

  return {};
}

function mapSources(rawUrls: string[]): string[] {
  const formatted = rawUrls.map((url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  });

  return ["All Sources", ...new Set(formatted)];
}

function isIsoDateString(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const crawledArticlesService = {
  async getCrawledArticles(params: GetCrawledArticlesParams, tenantId: string) {
    const offset = (params.page - 1) * params.limit;

    const range = normalizeDateRange(params);

    const repositoryParams: FetchCrawledArticlesParams = {
      source: params.source,
      from: range.from,
      to: range.to,
      q: params.q,
      status: params.status,
      offset,
      limit: params.limit,
      tenantId,
    };

    const [{ data, count }, sourceUrls] = await Promise.all([
      crawledArticlesRepository.fetchCrawledArticles(repositoryParams),
      crawledArticlesRepository.fetchCrawledSources(tenantId),
    ]);

    const articles = data.map((article) => {
      const imageUrl = getValidImageSrc(article.imageUrl);

      return {
        id: article.id,
        title: article.title,
        content: article.content,
        imageUrl,
        publishDate: article.publishDate,
        createdAt: article.createdAt,
        status: article.status,
        category: {
          categoryName: normalizeCategoryName(article.category?.categoryName) || "",
        },
        crawledUrl: {
          url: article.crawledUrl?.url || "",
        },
        contentArticle: Array.isArray(article.contentArticle)
          ? article.contentArticle[0] || null
          : article.contentArticle || null,
      };
    });

    return {
      articles,
      sources: mapSources(sourceUrls),
      pagination: {
        total: count,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(count / params.limit),
      },
    };
  },

  async triggerCrawl(params: TriggerCrawlParams) {
    if (!CRAWL_API_URL) {
      throw new CrawledArticlesServiceError(
        "CRAWL_API_URL is not set. Define it in .env (server-side).",
        500
      );
    }

    const urls = Array.isArray(params.urls)
      ? params.urls.filter((u) => typeof u === "string" && u.trim())
      : [];

    if (urls.length === 0) {
      throw new CrawledArticlesServiceError("urls is required", 400);
    }

    const payload: any = { 
      urls,
      tenant_id: params.tenant_id 
    };
    if (isIsoDateString(params.start_date)) payload.start_date = params.start_date;
    if (isIsoDateString(params.end_date)) payload.end_date = params.end_date;
    
    if (typeof params.max_articles === "number" && Number.isFinite(params.max_articles)) {
      payload.max_articles = Math.max(1, Math.floor(params.max_articles));
    }

    try {
      const upstream = await fetch(CRAWL_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      });

      const contentType = upstream.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const upstreamData = isJson
        ? await upstream.json().catch(() => null)
        : await upstream.text().catch(() => "");

      if (!upstream.ok) {
        const message =
          upstreamData &&
            typeof upstreamData === "object" &&
            ("error" in upstreamData || "message" in upstreamData) &&
            (
              (upstreamData as { error?: string; message?: string }).error ||
              (upstreamData as { error?: string; message?: string }).message
            )
            ? (upstreamData as { error?: string; message?: string }).error ||
            (upstreamData as { error?: string; message?: string }).message ||
            `Upstream error (${upstream.status})`
            : `Upstream error (${upstream.status})`;

        throw new CrawledArticlesServiceError(message, 502, {
          upstream_status: upstream.status,
          upstream: upstreamData,
        });
      }

      return { ok: true, upstream: upstreamData };
    } catch (error) {
      if (error instanceof CrawledArticlesServiceError) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Failed to reach crawl API";
      throw new CrawledArticlesServiceError(message, 502);
    }
  },
  async deleteRawArticle(id: string, tenantId: string) {
    return crawledArticlesRepository.deleteRawArticle(id, tenantId);
  },
};


