"use client";

import dynamic from "next/dynamic";
import { StoryImage } from "@/components/StoryImage";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { getCoreCategories } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";
import { getTechNewsTheme, techNewsVars } from "../technews-shared/theme";
import { toFeedRows, excerpt, type FeedRow } from "../technews-shared/feed";
import { FeedLink } from "../technews-shared/FeedLink";

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => (
    <div className="h-[110px] animate-pulse bg-[var(--tn-accent-soft)] border border-[var(--tn-rule)]" />
  ),
});

interface Props {
  domain: string;
  tenantId: string | null;
  articles: Parameters<typeof toFeedRows>[0];
  banners: { top: unknown[]; sidebar: unknown[]; footer: unknown[] };
  mediastackArticles?: MediaStackArticle[];
}

export default function MagazineAirLanding({ domain, articles, banners, mediastackArticles = [] }: Props) {
  const theme = getTechNewsTheme(domain);
  const rows = toFeedRows(articles, mediastackArticles);
  const categories = getCoreCategories(domain);

  const heroArticles = rows.slice(0, 3);
  const heroIds = new Set(heroArticles.map((a) => a.id));
  const rest = rows.filter((a) => !heroIds.has(a.id));

  const trending = rest.slice(0, 8);
  const trendingIds = new Set(trending.map((a) => a.id));
  const picks = rest.filter((a) => !trendingIds.has(a.id)).slice(0, 4);
  const pickIds = new Set(picks.map((a) => a.id));
  const latestPool = rest.filter((a) => !trendingIds.has(a.id) && !pickIds.has(a.id));
  const latestFeatured = latestPool.slice(0, 4);
  const listRows = latestPool.slice(4, 14);

  const catMap = new Map<string, FeedRow[]>();
  rows.forEach((a) => {
    const name = a.category?.categoryName;
    if (!name) return;
    if (!catMap.has(name)) catMap.set(name, []);
    catMap.get(name)!.push(a);
  });
  const catBlocks = categories
    .map((name) => ({ name, items: (catMap.get(name) ?? []).slice(0, 4) }))
    .filter((c) => c.items.length >= 3)
    .slice(0, 3);

  const main = heroArticles[0];
  const secondary = heroArticles.slice(1, 3);

  if (!theme) return null;
  const adKeys = ADSTERRA_CONFIG[theme.key]?.banners;
  const midFeedConfig = ADSTERRA_CONFIG[theme.key]?.midFeed;

  if (rows.length === 0) {
    return (
      <div style={techNewsVars(theme)} className="min-h-[60vh] bg-[var(--tn-bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-serif font-light text-[var(--tn-ink)] mb-2">Clear skies.</p>
          <p className="text-sm text-[var(--tn-muted)]">New reading arrives here soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={techNewsVars(theme)}
      className="bg-[var(--tn-bg)] text-[var(--tn-ink)] font-sans min-h-screen"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 flex flex-col items-center gap-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
        {adKeys?.["728x90"] && (
          <div className="hidden sm:block">
            <AdsterraBanner bannerKey={adKeys["728x90"]} width={728} height={90} className="!my-0" />
          </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {/* Hero — quiet, caption-led */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16">
          {main && (
            <div className="lg:col-span-8">
              <FeedLink row={main} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--tn-accent-soft)] mb-6">
                  <StoryImage src={main.imageUrl} alt={main.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-700" variant="hero" priority sizes="(max-width: 1024px) 100vw, 780px" />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-[0.34em] text-[var(--tn-accent)]">
                  {main.category?.categoryName ?? "Feature"}
                </span>
                <h1 className="font-serif text-4xl sm:text-5xl font-light leading-[1.12] tracking-[0.005em] text-[var(--tn-ink)] mt-4 mb-4 group-hover:text-[var(--tn-accent)] transition-colors">
                  {main.title}
                </h1>
                <p className="text-lg leading-[1.7] text-[var(--tn-muted)] max-w-[62ch]">
                  {excerpt(main.content, 220)}
                </p>
              </FeedLink>
            </div>
          )}
          <div className="lg:col-span-4 flex flex-col gap-10 lg:border-l lg:border-[var(--tn-rule)] lg:pl-10">
            <span className="text-[10px] font-medium uppercase tracking-[0.34em] text-[var(--tn-muted)]">Alongside</span>
            {secondary.map((article) => (
              <FeedLink key={article.id} row={article} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--tn-accent-soft)] mb-3">
                  <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-700" sizes="360px" />
                </div>
                <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-[var(--tn-accent)]">{article.category?.categoryName}</span>
                <h3 className="font-serif text-xl font-light leading-snug text-[var(--tn-ink)] mt-2 group-hover:text-[var(--tn-accent)] transition-colors">
                  {article.title}
                </h3>
              </FeedLink>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-8">
            <h2 className="font-serif text-2xl font-light tracking-[0.04em] text-[var(--tn-ink)] pb-3 border-b border-[var(--tn-rule)] mb-10">
              Latest
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12 mb-14">
              {latestFeatured.map((article) => (
                <FeedLink key={article.id} row={article} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[var(--tn-accent-soft)] mb-4">
                    <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-700" sizes="(max-width: 640px) 100vw, 360px" />
                  </div>
                  <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-[var(--tn-accent)] block mb-2">{article.category?.categoryName}</span>
                  <h4 className="font-serif text-xl font-light leading-snug text-[var(--tn-ink)] mb-2 group-hover:text-[var(--tn-accent)] transition-colors">{article.title}</h4>
                  <p className="text-sm leading-relaxed text-[var(--tn-muted)] line-clamp-2">{excerpt(article.content, 130)}</p>
                </FeedLink>
              ))}
            </div>

            {midFeedConfig && (
              <div className="flex justify-center my-12 py-6 border-y border-[var(--tn-rule)]">
                <AdsterraBanner bannerKey={midFeedConfig.key} width={midFeedConfig.width} height={midFeedConfig.height} className="!my-0" />
              </div>
            )}

            {listRows.length > 0 && (
              <div className="divide-y divide-[var(--tn-rule)] border-t border-[var(--tn-rule)]">
                {listRows.map((article) => (
                  <FeedLink key={article.id} row={article} className="group flex gap-6 items-center py-6">
                    <div className="relative w-32 aspect-[4/3] overflow-hidden shrink-0 bg-[var(--tn-accent-soft)]">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="128px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-[var(--tn-accent)] block mb-1.5">{article.category?.categoryName}</span>
                      <h4 className="font-serif text-lg font-light leading-snug text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">{article.title}</h4>
                    </div>
                  </FeedLink>
                ))}
              </div>
            )}

            {catBlocks.map((cat) => (
              <section key={cat.name} className="mt-14">
                <h3 className="font-serif text-xl font-light tracking-[0.04em] text-[var(--tn-ink)] pb-2 border-b border-[var(--tn-rule)] mb-6">
                  {cat.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                  {cat.items.map((article) => (
                    <FeedLink key={article.id} row={article} className="group flex gap-4 items-start">
                      <div className="relative w-20 aspect-square overflow-hidden shrink-0 bg-[var(--tn-accent-soft)]">
                        <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="80px" />
                      </div>
                      <h4 className="font-serif text-[15px] font-light leading-snug text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">{article.title}</h4>
                    </FeedLink>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Airy sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-12">
              <div>
                <h3 className="text-[10px] font-medium uppercase tracking-[0.34em] text-[var(--tn-muted)] pb-3 border-b border-[var(--tn-rule)] mb-6">
                  Most Read
                </h3>
                <ol className="flex flex-col divide-y divide-[var(--tn-rule)]">
                  {trending.map((article, i) => (
                    <FeedLink key={article.id} row={article} className="group flex gap-4 items-baseline py-4">
                      <span className="font-serif text-2xl font-light text-[var(--tn-rule)] group-hover:text-[var(--tn-accent)] transition-colors tabular-nums shrink-0">
                        {i + 1}
                      </span>
                      <h4 className="font-serif text-[15px] font-light leading-snug text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors">{article.title}</h4>
                    </FeedLink>
                  ))}
                </ol>
              </div>

              {picks.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.34em] text-[var(--tn-accent)] pb-3 border-b border-[var(--tn-accent)] mb-6">
                    Editor&apos;s Picks
                  </h3>
                  <div className="flex flex-col gap-6">
                    {picks.map((article) => (
                      <FeedLink key={article.id} row={article} className="group flex gap-4 items-center">
                        <div className="relative w-16 h-16 overflow-hidden shrink-0 bg-[var(--tn-accent-soft)]">
                          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="64px" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] font-medium uppercase tracking-[0.28em] text-[var(--tn-muted)] block mb-1">{article.category?.categoryName}</span>
                          <h4 className="font-serif text-sm font-light leading-snug text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">{article.title}</h4>
                        </div>
                      </FeedLink>
                    ))}
                  </div>
                </div>
              )}

              {adKeys?.["300x250"] && (
                <div className="flex justify-center border-t border-[var(--tn-rule)] pt-8">
                  <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} className="!my-0" />
                </div>
              )}
              <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar as never[]} />
            </div>
          </aside>
        </section>

        <div className="mt-16 border-t border-[var(--tn-rule)] pt-8">
          <AdsterraNativeBanner domain={domain} />
        </div>
      </main>
    </div>
  );
}
