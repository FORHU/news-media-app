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

/** Keeps only articles MediaStack reported as published within the last `hours`. */
export function filterMediaStackWithinHours(
  articles: MediaStackArticle[],
  hours: number
): MediaStackArticle[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return articles.filter((a) => new Date(a.publishedAt).getTime() >= cutoff);
}

/** MediaStack occasionally puts a non-image URL (an article page, a redirect
 *  link, etc.) in the `image` field — that fails Next's image optimizer at
 *  render time ("requested resource isn't a valid image ... received null").
 *  Require an actual image file extension so those get routed through
 *  fetchOgImage (or dropped) instead of being rendered directly. */
function looksLikeImageUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(pathname);
  } catch {
    return false;
  }
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

  // HTTPS requires a paid MediaStack plan (Standard+); the free tier is HTTP-only,
  // so keep an eye on this if the plan lapses.
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

    // Upgrade images: MediaStack's `image` is only the publisher's feed thumbnail
    // — often a tiny (~150px) crop, sometimes not even an image URL. Enrich when
    // the article has no image, a generic placeholder, a non-image URL, or an
    // obvious low-res thumbnail, pulling the article's real og:image instead
    // (usually 1200×630+). The free direct scrape runs for every candidate; the
    // rate-limited Microlink fallback only for the first handful (which get the
    // largest on-page slots).
    const enriched = await Promise.all(
      deduped.map(async (article, i) => {
        const img = article.image;
        const usable =
          !!img &&
          !isGenericPlaceholder(img) &&
          looksLikeImageUrl(img) &&
          !isLikelyLowResThumb(img);
        if (usable) return article;

        const better = await fetchOgImage(article.url, { allowMicrolink: i < 6 });
        if (better) return { ...article, image: better };
        // No upgrade found: keep a real (if small) thumbnail, but drop a
        // non-image URL so Next's optimizer doesn't choke on it.
        return img && looksLikeImageUrl(img) ? article : { ...article, image: null };
      })
    );

    return enriched;
  } catch (err) {
    console.error("[MediaStack] Fetch failed:", err);
    return [];
  }
}
