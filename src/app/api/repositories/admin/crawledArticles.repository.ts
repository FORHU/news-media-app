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

    let query = supabase
      .from("raw_articles")
      .select(
        `
          *,
          category:categories(*),
          crawledUrl:crawled_urls(*),
          contentArticle:content_articles(id)
        `,
        { count: "exact" }
      );

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
      data: (data as RawArticleSupabase[]) || [],
      count: count || 0,
    };
  },

  async fetchCrawledSources(): Promise<string[]> {
    const { data } = await supabase.from("crawled_urls").select("url");
    return (data || []).map((s: { url: string }) => s.url);
  },
};
