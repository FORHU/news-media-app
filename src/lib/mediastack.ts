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

/** Returns true when the image URL is a known generic aggregator thumbnail
 *  (e.g. the Google News logo) rather than the real article image. */
function isGenericPlaceholder(url: string): boolean {
  return (
    url.includes("googleusercontent.com") ||
    url.includes("gstatic.com") ||
    url.includes("news.google.com") ||
    url.includes("google.com/s2/favicons")
  );
}

// Use Microlink API to extract the real og:image from any article URL.
// Microlink handles JS-rendered pages and Google News redirects properly.
// Free tier: no API key needed. Cached 24h per URL to stay within limits.
async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(articleUrl)}&screenshot=false&prerender=false`;
    const res = await fetch(endpoint, {
      signal: controller.signal,
      next: { revalidate: 86400 }, // cache per-URL for 24h
      headers: { "x-api-key": "" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const img: string | undefined = json?.data?.image?.url;
    if (img && img.startsWith("http") && !isGenericPlaceholder(img)) return img;
    return null;
  } catch {
    return null;
  }
}

export async function fetchMediaStackNews(params: {
  categories?: string;
  languages?: string;
  countries?: string;
  sources?: string;
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
    ...(params.sources && { sources: params.sources }),
    ...(params.keywords && { keywords: params.keywords }),
  });

  // Free plan requires HTTP (not HTTPS)
  const url = `http://api.mediastack.com/v1/news?${query.toString()}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 2592000 }, // cache for 30 days — one API request per month per site
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

    // Detect branded placeholder images: if the same image URL appears on 2+
    // articles it is a site-wide default card (e.g. The Verge "TV", TechCrunch
    // "T"), not a real article image. Null those out before enrichment so
    // fetchOgImage runs on them and fetches the actual og:image.
    const imageFreq = new Map<string, number>();
    for (const a of raw) {
      if (a.image && !isGenericPlaceholder(a.image))
        imageFreq.set(a.image, (imageFreq.get(a.image) ?? 0) + 1);
    }
    const deduped = raw.map((a) => ({
      ...a,
      image: a.image && (imageFreq.get(a.image) ?? 0) > 1 ? null : a.image,
    }));

    // Enrich articles that still have no image or a known generic placeholder.
    const enriched = await Promise.all(
      deduped.map(async (article) => {
        if (article.image && !isGenericPlaceholder(article.image)) return article;
        const ogImage = await fetchOgImage(article.url);
        return { ...article, image: ogImage ?? null };
      })
    );

    return enriched;
  } catch (err) {
    console.error("[MediaStack] Fetch failed:", err);
    return [];
  }
}
