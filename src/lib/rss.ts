import Parser from "rss-parser";

export interface RssArticle {
  id: string;
  title: string;
  link: string;
  excerpt: string;
  imageUrl: string | null;
  category: string | null;
  pubDate: string;
  source: string;
  sourceDomain: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"],
    ],
  },
});

/**
 * rss-parser can return media elements as a single object {$: {url}} or as an
 * array [{$: {url}}, ...]. This helper normalises both forms and returns the
 * first usable URL.
 */
function pickUrl(val: unknown): string | null {
  if (!val) return null;
  if (Array.isArray(val)) {
    for (const v of val) {
      const u = pickUrl(v);
      if (u) return u;
    }
    return null;
  }
  const obj = val as Record<string, any>;
  return obj?.["$"]?.url || obj?.url || null;
}

function extractImage(item: any): string | null {
  // 1. media:thumbnail  {$: {url}} or [{$: {url}}]
  const thumb = pickUrl(item.mediaThumbnail);
  if (thumb) return thumb;

  // 2. media:content — prefer medium="image" entry, fall back to first url
  const mc = item.mediaContent;
  if (mc) {
    const entries: any[] = Array.isArray(mc) ? mc : [mc];
    const preferred = entries.find(
      (e) => e?.["$"]?.medium === "image" || e?.["$"]?.type?.startsWith("image")
    );
    const url = preferred?.["$"]?.url ?? entries[0]?.["$"]?.url ?? null;
    if (url) return url;
  }

  // 3. enclosure (image/* or untyped)
  const enc = item.enclosure;
  if (enc?.url && (!enc.type || enc.type.startsWith("image"))) return enc.url;

  // 4. First <img src="..."> found in any HTML content field
  const html: string =
    item["content:encoded"] ||
    item.content ||
    item.summary ||
    item.description ||
    "";
  if (html) {
    // Standard src attribute (single or double quotes)
    const srcMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (srcMatch?.[1]) return srcMatch[1];

    // data-src (lazy-loaded images used by some French tech sites)
    const dataSrcMatch = html.match(/<img[^>]+data-src=["']([^"']+)["']/i);
    if (dataSrcMatch?.[1]) return dataSrcMatch[1];
  }

  return null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export async function fetchRssFeed(
  url: string,
  source: string,
  limit = 10
): Promise<RssArticle[]> {
  try {
    const feed = await parser.parseURL(url);
    const sourceDomain = new URL(url).hostname.replace("www.", "");

    return feed.items.slice(0, limit).map((item, i) => ({
      id: `rss-${sourceDomain}-${i}-${Date.now()}`,
      title: item.title ?? "Untitled",
      link: item.link ?? "#",
      excerpt: item.contentSnippet
        ? stripHtml(item.contentSnippet).slice(0, 200)
        : "",
      imageUrl: extractImage(item),
      category: Array.isArray(item.categories)
        ? item.categories[0] ?? null
        : typeof item.categories === "string" ? item.categories : null,
      pubDate: item.pubDate ?? new Date().toISOString(),
      source,
      sourceDomain,
    }));
  } catch (err) {
    console.error(`[fetchRssFeed] Failed to fetch ${url}:`, err);
    return [];
  }
}
