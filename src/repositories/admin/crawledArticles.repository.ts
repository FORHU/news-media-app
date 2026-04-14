import { supabase } from "@/lib/supabaseClient";

export type FetchCrawledArticlesParams = {
  source: string;
  from?: string;
  to?: string;
  q: string;
  offset: number;
  limit: number;
};

type RawArticleSupabase = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  publish_date: string | null;
  created_at: string;
  status: string;
  category: { category_name: string } | null;
  crawledUrl: { url: string } | null;
  contentArticle: { id: string }[] | { id: string } | null;
};

export const crawledArticlesRepository = {
  async fetchCrawledArticles(params: FetchCrawledArticlesParams): Promise<{
    data: RawArticleSupabase[];
    count: number;
  }> {
    const { source, from, to, q, offset, limit } = params;

    const isSourceFilter = source && source !== "All Sources";
    const select = `
      *,
      category:categories(*),
      crawledUrl:crawled_urls${isSourceFilter ? "!inner" : ""}(*),
      contentArticle:content_articles(id)
    `;

    let query = supabase
      .from("raw_articles")
      .select(select, { count: "exact" });

    if (from) {
      query = query.gte("created_at", from);
    }

    if (to) {
      query = query.lte("created_at", to);
    }

    if (source !== "All Sources") {
      query = query.filter("crawledUrl.url", "ilike", `%${source}%`);
    }

    if (q) {
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return {
      data: (data as unknown as RawArticleSupabase[]) || [],
      count: count || 0,
    };
  },

  async fetchCrawledSources(): Promise<string[]> {
    // Only fetch sources from the associated crawled_urls table
    const { data } = await supabase
      .from("raw_articles")
      .select(`crawledUrl:crawled_urls(url)`);

    return (data || [])
      .map((item: { crawledUrl: { url: string } | { url: string }[] | null }) => {
        const cu = item.crawledUrl;
        return Array.isArray(cu) ? cu[0]?.url : cu?.url;
      })
      .filter((url): url is string => typeof url === "string");
  },
};

