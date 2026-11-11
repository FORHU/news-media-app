import Link from "next/link";
import { articlesService } from "@/services/articles.service";
import { resolveTenantIdFromDomain, getSiteLanguageFromDomain } from "@/lib/tenant";

/**
 * Plain, server-rendered list of the site's most recent published articles,
 * rendered at the bottom of the homepage.
 *
 * Why: the themed landing designs only surface the handful of stories that fit
 * their layouts (and the DB query behind them requires a featured image), so a
 * newly published article could be reachable only through sitemap.xml / feed.xml.
 * Google then reports it as "Discovered - currently not indexed". This list
 * gives every recent published article a crawlable <a href> from the homepage
 * HTML, without touching article copy or the landing designs.
 *
 * Labels are localized per site language; the article titles are the articles'
 * own.
 */

const MAX_ITEMS = 100;

const HEADINGS: Record<string, string> = {
  en: "Latest articles",
  de: "Neueste Artikel",
  es: "Últimas noticias",
  it: "Ultimi articoli",
  fr: "Derniers articles",
  "zh-CN": "最新文章",
  ko: "최신 기사",
  ja: "最新記事",
};

function dateOf(a: { publishDate?: Date | string | null; createdAt?: Date | string | null }): number {
  const t = new Date(a.publishDate ?? a.createdAt ?? 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

export async function RecentArticlesIndex({ domain }: { domain: string }) {
  const tenantId = await resolveTenantIdFromDomain(domain);
  if (!tenantId) return null;

  let articles: Awaited<ReturnType<typeof articlesService.getArticleSummaries>> = [];
  try {
    articles = await articlesService.getArticleSummaries({ limit: MAX_ITEMS, status: "published" }, tenantId);
  } catch (error) {
    console.error("[RecentArticlesIndex] query failed:", error);
    return null;
  }

  const items = articles
    .filter((a) => a.title?.trim() && (a.slug || a.id))
    .sort((a, b) => dateOf(b) - dateOf(a));
  if (items.length === 0) return null;

  const lang = getSiteLanguageFromDomain(domain);
  const heading = HEADINGS[lang] ?? HEADINGS.en;

  return (
    <nav
      aria-label={heading}
      className="w-full bg-white text-gray-800 border-t border-gray-200"
      data-section="recent-articles-index"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-base font-bold mb-4">{heading}</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/article/${encodeURIComponent(a.slug ?? a.id)}`}
                className="hover:underline"
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
