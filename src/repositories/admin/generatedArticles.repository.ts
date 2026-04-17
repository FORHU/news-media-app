import { supabase } from "@/lib/supabaseClient";
import { prisma } from "@/lib/db";

export type FetchGeneratedArticlesParams = {
  q: string;
  offset: number;
  limit: number;
  category?: string;
};

type ContentArticleSupabase = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  youtube_url: string | null;
  publish_date: string | null;
  created_at: string;
  status: string;
  category: { id: string; category_name: string } | null;
  user: { first_name: string; last_name: string } | null;
  rawArticle: {
    id: string;
    title: string;
    content: string | null;
    image_url: string | null;
    youtube_url: string | null;
    publish_date: string | null;
    created_at: string;
    status: string;
    category: { id: string; category_name: string } | null;
    crawledUrl: { url: string } | null;
  } | null;
};

export const generatedArticlesRepository = {
  async fetchGeneratedArticles(params: FetchGeneratedArticlesParams): Promise<{
    data: ContentArticleSupabase[];
    count: number;
  }> {
    const { q, offset, limit, category } = params;
    const hasCategoryFilter = Boolean(category && category !== "All Types");
    const categoryJoin = hasCategoryFilter ? "categories!inner(*)" : "categories(*)";

    let query = supabase
      .from("content_articles")
      .select(
        `
          *,
          category:${categoryJoin},
          user:users(*),
          rawArticle:raw_articles(
            *,
            category:categories(*),
            crawledUrl:crawled_urls(*)
          )
        `,
        { count: "exact" }
      );

    if (q) {
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    }

    if (hasCategoryFilter) {
      query = query.filter("category.category_name", "eq", category);
    }

    const { data, error, count } = await query
      .order("publish_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return {
      data: (data as ContentArticleSupabase[]) || [],
      count: count || 0,
    };
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await prisma.contentArticle.update({
      where: { id },
      data: { status },
    });
  },
};
