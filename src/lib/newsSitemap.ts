/**
 * Google News sitemap builder — pure functions, no DB or request access, so
 * the empty-window behaviour can be unit tested.
 *
 * Contract (see app/news-sitemap.xml/route.ts): the response is always a valid
 * <urlset> in the Google News namespace. When no article falls inside the
 * 48-hour window the urlset has no <url> children. It is never a 404 and never
 * an HTML / plain-text body, so Search Console never reports the sitemap as
 * "couldn't fetch".
 */

export const NEWS_WINDOW_MS = 1000 * 60 * 60 * 48;

export type NewsSitemapArticle = {
  slug?: string | null;
  id: string;
  title?: string | null;
  publishDate?: Date | string | null;
  createdAt?: Date | string | null;
};

export const xmlEscape = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function recentArticles<T extends NewsSitemapArticle>(
  articles: T[],
  now: number = Date.now()
): T[] {
  return articles.filter((a) => {
    const t = new Date(a.publishDate ?? a.createdAt ?? 0).getTime();
    return Number.isFinite(t) && t > 0 && now - t <= NEWS_WINDOW_MS && t <= now + 60_000;
  });
}

export function buildNewsSitemapXml(params: {
  baseUrl: string;
  publicationName: string;
  language: string;
  articles: NewsSitemapArticle[];
  now?: number;
}): string {
  const { baseUrl, publicationName, language, articles } = params;
  const now = params.now ?? Date.now();

  const urls = recentArticles(articles, now)
    .map((a) => {
      const slug = a.slug ?? a.id;
      const loc = `${baseUrl}/article/${encodeURIComponent(slug)}`;
      const pubDate = new Date(a.publishDate ?? a.createdAt ?? now).toISOString();
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(publicationName)}</news:name>
        <news:language>${xmlEscape(language)}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${xmlEscape(a.title ?? "Untitled")}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls ? `\n${urls}` : ""}
</urlset>`;
}
