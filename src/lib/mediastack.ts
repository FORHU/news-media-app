import { env } from "@/lib/env";
import { normalizeCategoryKey } from "@/config/categories";

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
  /** The site category this story was fetched for (set by the per-category
   *  feed pools in mediastack-feeds.ts). MediaStack's own `category` tag is
   *  too coarse to place a story, so when present this beats the keyword
   *  classifier. */
  topic?: string;
}

/** Cache window for MediaStack responses; see MEDIASTACK_REVALIDATE_SECONDS. */
function defaultRevalidateSeconds(): number {
  if (env.MEDIASTACK_REVALIDATE_SECONDS) return env.MEDIASTACK_REVALIDATE_SECONDS;
  return process.env.NODE_ENV === "development" ? 86400 : 14400;
}

/** Stable short hash (FNV-1a) so a story keeps the same id across renders and
 *  across the several feed pools it can appear in. */
export function stableHash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
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

/**
 * Narrows an already-fetched feed to a search. Filtering locally rather than
 * querying MediaStack keeps search free of extra API quota and og:image
 * scrapes; the trade-off is it only searches the stories already in the feed.
 * Every whitespace-separated term must appear in the title, description or
 * source. `category` matches MediaStack's own label (e.g. "technology") or,
 * when `categoryOf` is given, the topic that function assigns the story —
 * MediaStack's own tag is too coarse to place a story under a site's
 * categories, so callers pass a keyword classifier.
 */
export function filterMediaStackBySearch(
  articles: MediaStackArticle[],
  search?: string,
  category?: string,
  categoryOf?: (article: MediaStackArticle) => string | null,
): MediaStackArticle[] {
  const terms = (search ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const categoryKey = category ? normalizeCategoryKey(category) : null;

  return articles.filter((a) => {
    if (categoryKey) {
      // The pool's own category tag is authoritative; fall back to
      // MediaStack's label, then the keyword classifier.
      const matchesOwn =
        (!!a.topic && normalizeCategoryKey(a.topic) === categoryKey) ||
        normalizeCategoryKey(a.category) === categoryKey;
      if (!matchesOwn) {
        const topic = a.topic ? null : categoryOf?.(a);
        if (!topic || normalizeCategoryKey(topic) !== categoryKey) return false;
      }
    }
    if (terms.length === 0) return true;
    const haystack = `${a.title} ${a.description ?? ""} ${a.source} ${a.sourceDomain}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
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
    // Was 4000ms — too tight for smaller/overseas publisher sites (e.g. the
    // regional Italian sources techoggi.com pulls from), where TTFB alone can
    // exceed 4s from some hosting regions, aborting a scrape that would
    // otherwise have succeeded.
    const timer = setTimeout(() => controller.abort(), 8000);
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
    if (!res.ok) {
      console.warn(`[MediaStack] og:image scrape HTTP ${res.status} for ${articleUrl}`);
      return null;
    }
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
    console.warn(`[MediaStack] og:image scrape found no usable tag for ${articleUrl}`);
    return null;
  } catch (err) {
    // AbortError (timeout) vs a network-level failure (DNS, connection reset,
    // TLS, egress block) look identical from the caller's side otherwise —
    // this is the one place that can tell them apart.
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.warn(`[MediaStack] og:image scrape failed for ${articleUrl}: ${reason}`);
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

/**
 * Upgrade images: MediaStack's `image` is only the publisher's feed thumbnail
 * — often a tiny (~150px) crop, sometimes not even an image URL. Enrich when
 * the article has no image, a generic placeholder, a non-image URL, or an
 * obvious low-res thumbnail, pulling the article's real og:image instead
 * (usually 1200×630+). The free direct scrape runs for every candidate; the
 * rate-limited Microlink fallback only for the first `microlinkLimit` (default
 * 6), which get the largest on-page slots.
 *
 * Runs at most `concurrency` scrapes at once (default 20). Unbounded, a cold
 * cache fired ~1,000 simultaneous requests and a single page render took over
 * two minutes. Each scrape is cached per URL for 24h, so repeat renders are fast.
 *
 * Unless `requireImage` is false, articles that still have no usable image are
 * dropped: they can't be shown as a card without a placeholder box.
 */
export async function enrichImages(
  articles: MediaStackArticle[],
  opts: { microlinkLimit?: number; requireImage?: boolean; label?: string; concurrency?: number } = {},
): Promise<MediaStackArticle[]> {
  const enriched: MediaStackArticle[] = new Array(articles.length);
  let nextIndex = 0;

  const enrichOne = async (article: MediaStackArticle, i: number): Promise<MediaStackArticle> => {
    const img = article.image;
    const usable =
      !!img &&
      !isGenericPlaceholder(img) &&
      looksLikeImageUrl(img) &&
      !isLikelyLowResThumb(img);
    if (usable) return article;

    const better = await fetchOgImage(article.url, { allowMicrolink: i < (opts.microlinkLimit ?? 6) });
    if (better) return { ...article, image: better };
    // No upgrade found: keep a real (if small) thumbnail, but drop a
    // non-image URL so Next's optimizer doesn't choke on it.
    return img && looksLikeImageUrl(img) ? article : { ...article, image: null };
  };

  const worker = async () => {
    for (;;) {
      const i = nextIndex++;
      if (i >= articles.length) return;
      enriched[i] = await enrichOne(articles[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(opts.concurrency ?? 20, articles.length) }, worker));

  const withImage = enriched.filter((article) => article.image !== null).length;
  console.log(`[MediaStack] ${opts.label ?? "enrich"}: ${withImage}/${enriched.length} articles got a usable image`);

  return opts.requireImage === false ? enriched : enriched.filter((article) => article.image !== null);
}

export async function fetchMediaStackNews(params: {
  categories?: string;
  languages?: string;
  countries?: string;
  sources?: string;
  limit?: number;
  keywords?: string;
  /** Drop articles that end up with no usable image after enrichment.
   *  Defaults to true (existing behavior) — set false for callers that only
   *  need headline/text (e.g. a ticker) so they aren't starved by scrape
   *  failures on sources that never send back an `image` in the first place. */
  requireImage?: boolean;
  /** How many of the top candidates get the rate-limited Microlink fallback
   *  when the free direct scrape fails. Defaults to 6. Raise for sources that
   *  disproportionately need it (e.g. techoggi.com, where MediaStack's
   *  Italian results never carry a direct `image`, so every article depends
   *  entirely on scraping succeeding). */
  microlinkLimit?: number;
  /** Cache window in seconds. Defaults to MEDIASTACK_REVALIDATE_SECONDS (4h). */
  revalidate?: number;
  /** Set false to skip image enrichment and return the raw stories; the caller
   *  then runs enrichImages() on whatever it keeps. Defaults to true. */
  enrich?: boolean;
}): Promise<MediaStackArticle[]> {
  const apiKey = env.MEDIASTACK_API_KEY;
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

  const attempt = async (init: RequestInit): Promise<{ json: MediaStackResponse } | null> => {
    const res = await fetch(url, init).catch(() => null);
    if (!res || !res.ok) return null;
    return { json: (await res.json()) as MediaStackResponse };
  };

  // A transient MediaStack failure (rate limit, hiccup, etc.) must not get
  // cached for a whole window — that would blank out a tenant's feed until it
  // expires. Try the normal cached request first; if it comes back empty or
  // errored, retry once bypassing the cache so a bad response can't stick.
  let result = await attempt({ next: { revalidate: params.revalidate ?? defaultRevalidateSeconds() } });
  if (!result || result.json.error || (result.json.data?.length ?? 0) === 0) {
    console.error(
      !result
        ? "[MediaStack] request failed, retrying uncached"
        : result.json.error
          ? `[MediaStack] API error, retrying uncached: ${result.json.error.message}`
          : "[MediaStack] empty response, retrying uncached",
    );
    result = await attempt({ cache: "no-store" });
  }

  try {
    if (!result) {
      console.error("[MediaStack] Fetch failed after retry");
      return [];
    }
    const { json } = result;

    if (json.error) {
      console.error("[MediaStack] API error:", json.error.message);
      return [];
    }

    const raw = (json.data ?? []).map((item) => ({
      id: `ms-${stableHash(item.url).toString(36)}`,
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

    // Callers that filter / de-duplicate / slice the results first (the
    // per-category feed pools) skip enrichment here and call enrichImages()
    // themselves on the stories they actually keep.
    if (params.enrich === false) return deduped;

    return enrichImages(deduped, {
      microlinkLimit: params.microlinkLimit,
      requireImage: params.requireImage,
      label: `${params.languages ?? "en"}/${params.keywords ?? params.categories}`,
    });
  } catch (err) {
    console.error("[MediaStack] Fetch failed:", err);
    return [];
  }
}
