import { supabase } from "@/lib/supabaseClient";

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
  publish_date: string | null;
  created_at: string;
  status: string;
  category: { category_name: string } | null;
  user: { first_name: string; last_name: string } | null;
};

export const generatedArticlesRepository = {
  async fetchGeneratedArticles(params: FetchGeneratedArticlesParams): Promise<{
    data: ContentArticleSupabase[];
    count: number;
  }> {
    const { q, offset, limit, category } = params;

    let query = supabase
      .from("content_articles")
      .select(
        `
          *,
          category:categories(*),
          user:users(*)
        `,
        { count: "exact" }
      );

    if (q) {
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    }

    if (category && category !== "All Types") {
      query = query.filter("category.category_name", "ilike", `%${category}%`);
    }

    const { data, error, count } = await query
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
};
