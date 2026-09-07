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

/** MediaStack `image` URLs that are obviously low-res publisher thumbnails, not
 *  the full article image. Extend as new patterns show up in the wild. */
function isLikelyLowResThumb(url: string): boolean {
  return (
    /\/1s\//.test(url) ||                       // DailyMail small mirror
    /-image-[ms]-\d/.test(url) ||               // DailyMail "-image-m-16" / "-image-s-"
    /-\d{2,3}x\d{2,3}\.(jpe?g|png|webp)/i.test(url) || // WordPress "-150x150.jpg"
    /[?&](w|width|resize)=(\d{1,3})(&|$)/i.test(url) || // "?w=320"
    /=s\d{2,3}(-|$)/.test(url)                  // Google "=s90"
  );
}

// Pull og:image / twitter:image straight from the article HTML — free, no
// third-party. Works for most news sites that render meta tags server-side.
async function fetchOgImageDirect(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      next: { revalidate: 86400 },
      headers: {
        // A real UA — some publishers serve bare markup to unknown clients.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        // og:image lives in <head>; ask for just the start of the document.
        // Compliant servers honour this; the rest send the full body and we cap
        // the parse below.
        Range: "bytes=0-65535",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    // Only need the <head>; cap the body read so we don't download whole pages.
    const html = (await res.text()).slice(0, 60000);
    const m =
      html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i);
    const img = m?.[1]?.trim();
    if (img && img.startsWith("http") && !isGenericPlaceholder(img) && !isLikelyLowResThumb(img)) {
      return img;
    }
    return null;
  } catch {
    return null;
  }
}

// Microlink fallback — handles JS-rendered pages and Google News redirects that
// the direct fetch can't. Free tier: no API key, ~50 req/day, so it's only hit
// when the direct scrape fails. Cached 24h per URL.
async function fetchOgImageMicrolink(articleUrl: string): Promise<string | null> {
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

/** Best available article image: free direct og:image scrape first, then the
 *  rate-limited Microlink fallback (only when `allowMicrolink` is set). */
async function fetchOgImage(
  articleUrl: string,
  opts: { allowMicrolink?: boolean } = {},
): Promise<string | null> {
  const direct = await fetchOgImageDirect(articleUrl);
  if (direct) return direct;
  if (opts.allowMicrolink) return fetchOgImageMicrolink(articleUrl);
  return null;
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

  // HTTPS requires a paid MediaStack plan (Standard+); it silently falls back to
  // HTTP-only on the free tier, so keep an eye on this if the plan lapses.
  const url = `https://api.mediastack.com/v1/news?${query.toString()}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // cache for 24 hours
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

    // Upgrade images: MediaStack's `image` is just the publisher's feed thumbnail,
    // which is often a tiny (~150px) crop. For any article with no image, a
    // generic placeholder, or an obvious low-res thumbnail, pull the article's
    // real og:image instead (usually 1200×630+). The free direct scrape runs for
    // every candidate; the rate-limited Microlink fallback only for the first
    // handful (which get the largest on-page slots).
    const enriched = await Promise.all(
      deduped.map(async (article, i) => {
        const hasImage = !!article.image && !isGenericPlaceholder(article.image);
        const lowRes = hasImage && isLikelyLowResThumb(article.image as string);
        if (hasImage && !lowRes) return article;

        const better = await fetchOgImage(article.url, { allowMicrolink: i < 6 });
        if (better) return { ...article, image: better };
        // No upgrade found — a small thumbnail still beats nothing.
        return hasImage ? article : { ...article, image: null };
      })
    );

    return enriched;
  } catch (err) {
    console.error("[MediaStack] Fetch failed:", err);
    return [];
  }
}
