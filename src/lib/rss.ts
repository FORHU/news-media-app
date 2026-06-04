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

function extractImage(item: any): string | null {
  return (
    item.mediaThumbnail?.$.url ||
    item.mediaContent?.$.url ||
    item.enclosure?.url ||
    null
  );
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
      // Discovery model: only use the RSS-provided snippet, never full content
      excerpt: item.contentSnippet
        ? stripHtml(item.contentSnippet).slice(0, 200)
        : "",
      imageUrl: extractImage(item),
      category: Array.isArray(item.categories)
        ? item.categories[0] ?? null
        : item.categories ?? null,
      pubDate: item.pubDate ?? new Date().toISOString(),
      source,
      sourceDomain,
    }));
  } catch (err) {
    console.error(`[fetchRssFeed] Failed to fetch ${url}:`, err);
    return [];
  }
}
