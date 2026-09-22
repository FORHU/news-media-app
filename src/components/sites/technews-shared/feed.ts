import type { MediaStackArticle } from "@/lib/mediastack";

/**
 * Unified row type for the technews family layouts.
 *
 * Each domain's Landing is ported from a different existing tenant, but they all
 * consume `FeedRow[]` so DB articles and the MediaStack "technology" feed can be
 * blended — the pages stay populated before editors have published anything.
 * `external` rows link out (target=_blank); internal rows link to /article/<id>.
 */
export interface FeedRow {
  id: string;
  slug: string | null;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  trendingScore: number | null;
  isHeadline: boolean | null;
  status: string;
  category: { categoryName: string | null } | null;
  href: string;
  external: boolean;
  source: string | null;
}

interface DbArticleish {
  id: string;
  slug?: string | null;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  trendingScore?: number | null;
  isHeadline?: boolean | null;
  status?: string | null;
  category?: { categoryName?: string | null } | null;
}

function cleanImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.includes("googleusercontent.com") ||
    url.includes("gstatic.com") ||
    url.includes("news.google.com") ||
    url.includes("google.com/s2/favicons")
  )
    return null;
  return url;
}

function fromDb(a: DbArticleish): FeedRow {
  return {
    id: a.id,
    slug: a.slug ?? null,
    title: a.title,
    content: (a.content ?? "").replace(/<[^>]+>/g, "").trim(),
    imageUrl: a.imageUrl ?? null,
    createdAt: (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)).toISOString(),
    trendingScore: a.trendingScore ?? null,
    isHeadline: a.isHeadline ?? null,
    status: a.status ?? "published",
    category: a.category ? { categoryName: a.category.categoryName ?? null } : null,
    href: `/article/${a.slug || a.id}`,
    external: false,
    source: null,
  };
}

function fromMediaStack(a: MediaStackArticle): FeedRow {
  const host = (a.sourceDomain || a.source || "").replace(/^www\./, "");
  return {
    id: a.id,
    slug: null,
    title: a.title,
    content: (a.description ?? "").trim(),
    imageUrl: cleanImage(a.image),
    createdAt: a.publishedAt,
    trendingScore: null,
    isHeadline: null,
    status: "published",
    category: { categoryName: a.category || host || "Tech" },
    href: a.url,
    external: true,
    source: host || null,
  };
}

function sortRows(rows: FeedRow[]): FeedRow[] {
  return [...rows].sort((a, b) => {
    const ah = a.isHeadline ? 1 : 0;
    const bh = b.isHeadline ? 1 : 0;
    if (bh !== ah) return bh - ah;
    if ((b.trendingScore ?? 0) !== (a.trendingScore ?? 0)) {
      return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Merge DB articles with the MediaStack feed, interleaved by recency (an
 * editor's `isHeadline` pin, or a `trendingScore`, still floats a row to the
 * top — MediaStack rows never carry either, so they only win on freshness).
 * Sites with a handful of published articles used to have DB rows fill the
 * whole hero + top-slots cluster before a single external row could appear,
 * which made the homepage look like nothing but self-published content.
 * `requireImage` drops external rows without a usable image (keeps grids from
 * looking broken).
 */
export function toFeedRows(
  articles: DbArticleish[],
  mediastack: MediaStackArticle[] = [],
  opts: { requireImage?: boolean } = {},
): FeedRow[] {
  const db = articles.map(fromDb);
  let ms = mediastack.map(fromMediaStack);
  if (opts.requireImage) ms = ms.filter((r) => r.imageUrl !== null);
  return sortRows([...db, ...ms]);
}

export function excerpt(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}
