import { supabase } from "@/lib/supabaseClient";

type CrawlJobRow = {
  id: string;
  status: string | null;
  urls: unknown;
  max_articles_request: number | null;
  articles_saved: number | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export const crawlJobsRepository = {
  async fetchJobs(params: { offset: number; limit: number }) {
    const { data, error, count } = await supabase
      .from("crawl_jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (error) throw error;

    return {
      rows: ((data as CrawlJobRow[]) || []) satisfies CrawlJobRow[],
      count: count || 0,
    };
  },
};

