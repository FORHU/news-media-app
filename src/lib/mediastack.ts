export interface MediaStackArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  sourceDomain: string;
  image: string | null;
  category: string;
  publishedAt: string;
}

interface MediaStackResponse {
  data: {
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    source: string;
    image: string | null;
    category: string;
    language: string;
    country: string;
    published_at: string;
  }[];
  error?: { code: string; message: string };
}

// Fetch the og:image from an article page, with a 3s timeout.
// Cached for 24h so repeated page loads don't re-fetch.
async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)" },
      next: { revalidate: 86400 }, // cache 24h
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function fetchMediaStackNews(params: {
  categories?: string;
  languages?: string;
  countries?: string;
  limit?: number;
  keywords?: string;
}): Promise<MediaStackArticle[]> {
  const apiKey = process.env.MEDIASTACK_API_KEY;
  if (!apiKey) {
    console.warn("[MediaStack] MEDIASTACK_API_KEY is not set");
    return [];
  }

  const query = new URLSearchParams({
    access_key: apiKey,
    languages: params.languages ?? "en",
    limit: String(params.limit ?? 12),
    sort: "published_desc",
    ...(params.categories && { categories: params.categories }),
    ...(params.countries && { countries: params.countries }),
    ...(params.keywords && { keywords: params.keywords }),
  });

  // Free plan requires HTTP (not HTTPS)
  const url = `http://api.mediastack.com/v1/news?${query.toString()}`;

  try {
    // Free tier: 500 requests/month. Weekly revalidation = ~4 requests/month.
    const res = await fetch(url, {
      next: { revalidate: 604800 }, // 1 week
    });

    if (!res.ok) {
      console.error(`[MediaStack] HTTP ${res.status}`);
      return [];
    }

    const json: MediaStackResponse = await res.json();

    if (json.error) {
      console.error("[MediaStack] API error:", json.error.message);
      return [];
    }

    const raw = (json.data ?? []).map((item, i) => ({
      id: `ms-${i}-${Date.now()}`,
      title: item.title,
      description: item.description,
      url: item.url,
      source: item.source,
      sourceDomain: (() => {
        try { return new URL(item.url).hostname.replace("www.", ""); } catch { return ""; }
      })(),
      image: item.image,
      category: item.category,
      publishedAt: item.published_at,
    }));

    // Enrich articles missing images by fetching og:image in parallel
    const enriched = await Promise.all(
      raw.map(async (article) => {
        if (article.image) return article;
        const ogImage = await fetchOgImage(article.url);
        return { ...article, image: ogImage };
      })
    );

    return enriched;
  } catch (err) {
    console.error("[MediaStack] Fetch failed:", err);
    return [];
  }
}
