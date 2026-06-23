"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { StoryImage } from "@/components/StoryImage";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { getCoreCategories, normalizeCategoryKey } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";

const SKYBLUEPRIME_CATEGORIES = getCoreCategories("skyblueprime.com");
const CANONICAL_CATEGORY_MAP = new Map(
  SKYBLUEPRIME_CATEGORIES.map((c) => [normalizeCategoryKey(c), c.trim()])
);

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => (
    <div className="h-[100px] animate-pulse bg-sky-50 rounded-xl border border-sky-100" />
  ),
});

const adKeys = ADSTERRA_CONFIG.skyblueprime.banners;

// External (media-source) article images come from arbitrary third-party
// hosts — kept separate from StoryImage (which has its own internal-content
// assumptions) so a failed load here degrades visibly to the label fallback
// instead of silently reusing unrelated fallback behavior.
function ExternalThumb({
  src,
  alt,
  label,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  label: string;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-full h-full bg-sky-200 flex items-center justify-center">
        <span className="text-sky-500 text-xs font-bold uppercase px-2 text-center">{label}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

interface ArticleRow {
  id: string;
  slug?: string | null;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  trendingScore?: number | null;
  isHeadline?: boolean | null;
  category?: { categoryName?: string | null } | null;
}

interface Props {
  tenantId: string | null;
  articles: ArticleRow[];
  banners: {
    top: unknown[];
    sidebar: unknown[];
    footer: unknown[];
  };
  mediastackArticles?: MediaStackArticle[];
}

function articleHref(article: { slug?: string | null; id: string }) {
  return `/article/${article.slug || article.id}`;
}

function excerpt(text: string | null | undefined, max = 120) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

function isMs(a: ArticleRow | MediaStackArticle): a is MediaStackArticle {
  return "url" in a && "source" in a && !("slug" in a);
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

function LeaderboardAd() {
  return (
    <div className="flex justify-center py-5 border-y border-sky-100 bg-sky-50/40">
      <div className="hidden sm:block">
        <AdsterraBanner bannerKey={adKeys["468x60"]} width={468} height={60} className="!my-0" />
      </div>
      <div className="block sm:hidden">
        <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} className="!my-0" />
      </div>
    </div>
  );
}

function MediumRectAd({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} className="!my-0" />
    </div>
  );
}

export default function SkyBluePrimeLanding({ articles, banners, mediastackArticles = [] }: Props) {
  const sorted = [...articles].sort((a, b) => {
    const aHeadline = a.isHeadline ? 1 : 0;
    const bHeadline = b.isHeadline ? 1 : 0;
    if (bHeadline !== aHeadline) return bHeadline - aHeadline;
    if ((b.trendingScore ?? 0) !== (a.trendingScore ?? 0)) {
      return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Deduplicated slices — each article appears in exactly one section
  const hero = sorted[0];
  const dbPicks = sorted.slice(1, 6);
  const dbTrending = sorted.slice(6, 10);
  const dbCenter = sorted.slice(10, 15);

  // Filter to articles that have a real (non-placeholder) image
  const msWithImage = mediastackArticles.filter((a) => cleanImage(a.image) !== null);

  // Sections: Tech Buzz [0-3], In the Tech World [4-9], Tech Digest [10-29]
  // Cap digest at index 30 so [30+] stays available as sidebar fallback
  const msDigestPool = msWithImage.slice(10, 30);
  const msDigestMid = Math.ceil(msDigestPool.length / 2);
  const msDigestLeft = msDigestPool.slice(0, msDigestMid);
  const msDigestRight = msDigestPool.slice(msDigestMid);

  // [30+] reserved as fallback for picks / trending / centerArticles
  const msFallback = msWithImage.slice(30);
  let fbCursor = 0;

  const picks: (ArticleRow | MediaStackArticle)[] = [...dbPicks];
  while (picks.length < 5 && fbCursor < msFallback.length) picks.push(msFallback[fbCursor++]);

  const trending: (ArticleRow | MediaStackArticle)[] = [...dbTrending];
  while (trending.length < 4 && fbCursor < msFallback.length) trending.push(msFallback[fbCursor++]);

  const centerArticles: (ArticleRow | MediaStackArticle)[] = [...dbCenter];
  while (centerArticles.length < 5 && fbCursor < msFallback.length) centerArticles.push(msFallback[fbCursor++]);

  const usedIds = new Set([
    hero?.id,
    ...dbPicks.map((a) => a.id),
    ...dbTrending.map((a) => a.id),
    ...dbCenter.map((a) => a.id),
  ]);

  const groupedCategoriesMap = new Map<string, ArticleRow[]>();
  for (const a of sorted) {
    if (usedIds.has(a.id)) continue; // skip already-displayed articles
    const rawCat = a.category?.categoryName || "Uncategorized";
    const cat = CANONICAL_CATEGORY_MAP.get(normalizeCategoryKey(rawCat)) ?? rawCat;
    if (!groupedCategoriesMap.has(cat)) groupedCategoriesMap.set(cat, []);
    groupedCategoriesMap.get(cat)!.push(a);
  }
  const groupedCategories = Array.from(groupedCategoriesMap.entries()).map(([name, items]) => ({ name, items }));

  return (
    <div className="min-h-screen bg-white">

      {/* ── Top Leaderboard ─────────────────────────────── */}
      {banners.top && banners.top.length > 0 ? (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 border-b border-sky-100 mb-8">
          <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
        </div>
      ) : (
        <div className="border-b border-sky-100 mb-8">
          <LeaderboardAd />
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-16">

        {/* ── Hero Grid ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">

          {/* Left: Today's Picks */}
          <aside className="lg:col-span-3 order-2 lg:order-1 flex flex-col gap-0">
            <div className="border-t-4 border-sky-950 pt-2 mb-6">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-white bg-sky-950 inline-block px-2 py-1">
                Today&apos;s Picks
              </h2>
            </div>
            <div className="space-y-6">
              {picks.map((article) => {
                const external = isMs(article);
                const imgSrc = external ? article.image : article.imageUrl;
                const label = external ? article.source : (article.category?.categoryName ?? "News");
                const cardBody = (
                  <>
                    <div className="relative aspect-[3/2] w-full mb-3 bg-sky-100 overflow-hidden">
                      {external ? (
                        imgSrc
                          ? <ExternalThumb src={imgSrc} alt={article.title} label={label} sizes="(max-width: 1024px) 100vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-sky-200 flex items-center justify-center"><span className="text-sky-500 text-xs font-bold uppercase px-2 text-center">{label}</span></div>
                      ) : (
                        <StoryImage src={imgSrc} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 1024px) 100vw, 25vw" />
                      )}
                    </div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-1">{label}</span>
                    <h3 className="text-[16px] font-bold text-sky-950 leading-tight group-hover:text-sky-600 transition-colors">{article.title}</h3>
                  </>
                );
                return external
                  ? <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="group block border-b border-sky-100 pb-6 last:border-0">{cardBody}</a>
                  : <Link key={article.id} href={articleHref(article)} className="group block border-b border-sky-100 pb-6 last:border-0">{cardBody}</Link>;
              })}
            </div>
          </aside>

          {/* Center: Hero Article */}
          <section className="lg:col-span-6 order-1 lg:order-2">
            {hero ? (
              <article className="flex flex-col items-center text-center">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-4 block">
                  {hero.category?.categoryName ?? "Featured Story"}
                </span>

                <Link href={articleHref(hero)} className="group block mb-5">
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-sky-950 leading-[1.05] tracking-tight group-hover:text-sky-700 transition-colors">
                    {hero.title}
                  </h1>
                </Link>

                <p className="text-lg text-sky-800/90 max-w-2xl mb-6 leading-relaxed font-medium">
                  {excerpt(hero.content, 180)}
                </p>

                <div className="w-full relative aspect-[16/9] bg-sky-100 overflow-hidden mb-6">
                  <Link href={articleHref(hero)} className="group block w-full h-full">
                    <StoryImage
                      src={hero.imageUrl}
                      alt={hero.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </Link>
                </div>

                {/* Leaderboard below hero image */}
                <div className="w-full flex justify-center border-t border-sky-100 pt-4 mb-6">
                  <div className="hidden sm:block">
                    <AdsterraBanner bannerKey={adKeys["468x60"]} width={468} height={60} className="!my-0" />
                  </div>
                  <div className="block sm:hidden">
                    <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} className="!my-0" />
                  </div>
                </div>

                {/* Below-headline article rows */}
                {centerArticles.length > 0 && (
                  <div className="w-full text-left flex flex-col divide-y divide-sky-100 border-t border-sky-100">
                    {centerArticles.map((article) => {
                      const external = isMs(article);
                      const imgSrc = external ? article.image : article.imageUrl;
                      const label = external ? article.source : (article.category?.categoryName ?? "News");
                      const desc = external ? article.description : excerpt(article.content, 100);
                      const rowBody = (
                        <>
                          <div className="relative w-[160px] h-[110px] shrink-0 bg-sky-100 overflow-hidden">
                            {external ? (
                              imgSrc
                                ? <ExternalThumb src={imgSrc} alt={article.title} label={label} sizes="160px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                : <div className="w-full h-full bg-sky-200 flex items-center justify-center"><span className="text-sky-500 text-xs font-bold uppercase px-2 text-center">{label}</span></div>
                            ) : (
                              <StoryImage src={imgSrc} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="160px" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">{label}</span>
                            <h3 className="text-[17px] font-bold text-sky-950 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">{article.title}</h3>
                            {desc && <p className="text-[13px] text-sky-700/80 leading-snug line-clamp-2">{desc}</p>}
                          </div>
                        </>
                      );
                      return external
                        ? <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="group flex gap-5 items-center py-5 hover:bg-sky-50/40 transition-colors">{rowBody}</a>
                        : <Link key={article.id} href={articleHref(article)} className="group flex gap-5 items-center py-5 hover:bg-sky-50/40 transition-colors">{rowBody}</Link>;
                    })}
                  </div>
                )}
              </article>
            ) : (
              <div className="border-t-4 border-sky-950 pt-16 text-center">
                <p className="text-sky-600 font-medium text-xl">No published articles yet.</p>
                <p className="text-sm text-sky-500 mt-2">Check back soon for the latest from Sky Blue Prime.</p>
              </div>
            )}
          </section>

          {/* Right: Trending Stories */}
          <aside className="lg:col-span-3 order-3 flex flex-col gap-0">
            <div className="border-t-4 border-sky-950 pt-2 mb-6">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-white bg-sky-950 inline-block px-2 py-1">
                Trending
              </h2>
            </div>
            <div className="space-y-6">
              {trending.map((article) => {
                const external = isMs(article);
                const imgSrc = external ? article.image : article.imageUrl;
                const label = external ? article.source : (article.category?.categoryName ?? "News");
                const cardBody = (
                  <>
                    <div className="relative aspect-[3/2] w-full mb-3 bg-sky-100 overflow-hidden">
                      {external ? (
                        imgSrc
                          ? <ExternalThumb src={imgSrc} alt={article.title} label={label} sizes="(max-width: 1024px) 100vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-sky-200 flex items-center justify-center"><span className="text-sky-500 text-xs font-bold uppercase px-2 text-center">{label}</span></div>
                      ) : (
                        <StoryImage src={imgSrc} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 1024px) 100vw, 25vw" />
                      )}
                    </div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-1">{label}</span>
                    <h3 className="text-[16px] font-bold text-sky-950 leading-tight group-hover:text-sky-600 transition-colors">{article.title}</h3>
                  </>
                );
                return external
                  ? <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="group block border-b border-sky-100 pb-6 last:border-0">{cardBody}</a>
                  : <Link key={article.id} href={articleHref(article)} className="group block border-b border-sky-100 pb-6 last:border-0">{cardBody}</Link>;
              })}
            </div>

            {/* 300x250 Ad below trending */}
            <div className="mt-8 flex justify-center border-t border-sky-100 pt-6">
              <MediumRectAd />
            </div>
          </aside>

        </div>

        {/* ── Mid-feed Leaderboard ─────────────────────────── */}
        <div className="mt-12">
          <LeaderboardAd />
        </div>

        {/* ── Category Blocks ──────────────────────────────── */}
        {groupedCategories.map((group) => {
          const heroArticle = group.items[0];
          const otherArticles = group.items.slice(1, 5);
          if (!heroArticle) return null;

          return (
            <div key={group.name}>
              <section className="mt-12">
                {/* Section Header */}
                <div className="border-t-[6px] border-sky-950 pt-3 mb-8">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-white bg-sky-950 inline-block px-3 py-1.5 leading-none">
                    {group.name}
                  </h2>
                </div>

                {/* Category Hero */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-8">
                  <div className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto lg:h-[420px] overflow-hidden bg-sky-100 group">
                    <Link href={articleHref(heroArticle)} className="block w-full h-full">
                      <StoryImage
                        src={heroArticle.imageUrl}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        alt={heroArticle.title}
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                    </Link>
                  </div>
                  <div className="lg:col-span-5 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-4 block">
                      {heroArticle.category?.categoryName}
                    </span>
                    <Link href={articleHref(heroArticle)} className="block mb-4 group">
                      <h3 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-black text-sky-950 leading-[1.05] tracking-tight group-hover:text-sky-700 transition-colors">
                        {heroArticle.title}
                      </h3>
                    </Link>
                    <p className="text-base text-sky-800/90 mb-6 font-medium leading-relaxed">
                      {excerpt(heroArticle.content, 180)}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-950">
                      BY SKY BLUE PRIME
                    </span>
                  </div>
                </div>

                {/* Sub-Articles Grid */}
                {otherArticles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 border-t border-sky-100 pt-6">
                    {otherArticles.map((article) => (
                      <Link href={articleHref(article)} key={article.id} className="group flex gap-3 items-start">
                        <div className="relative w-[80px] h-[80px] bg-sky-100 overflow-hidden shrink-0">
                          <StoryImage
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="80px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-1 leading-none">
                            {article.category?.categoryName}
                          </span>
                          <h4 className="text-[14px] font-bold text-sky-950 leading-snug group-hover:text-sky-600 transition-colors">
                            {article.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

            </div>
          );
        })}

        {/* ── Tech Buzz — 4-card grid (msWithImage 0–3) ─────── */}
        {msWithImage.length > 0 && (
          <section className="mt-12">
            <div className="border-t-[6px] border-sky-500 pt-3 mb-8">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-white bg-sky-500 inline-block px-3 py-1.5 leading-none">
                Tech Buzz
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {msWithImage.slice(0, 4).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-white border border-sky-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[16/9] bg-sky-100 overflow-hidden">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-sky-200 flex items-center justify-center">
                        <span className="text-sky-500 text-xs font-bold uppercase px-2 text-center">{item.source}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">{item.source}</span>
                    <h3 className="text-[15px] font-bold text-sky-950 leading-snug group-hover:text-sky-600 transition-colors line-clamp-3 flex-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-[12px] text-sky-700/80 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                    <span className="text-[10px] text-sky-400 font-medium">
                      {new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── In the Tech World — 3-col list (msWithImage 4–9) ── */}
        {msWithImage.length > 4 && (
          <section className="mt-12">
            <div className="border-t-[6px] border-sky-950 pt-3 mb-8">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-white bg-sky-950 inline-block px-3 py-1.5 leading-none">
                In the Tech World
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {msWithImage.slice(4, 10).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4 items-start bg-white border border-sky-100 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-[90px] h-[70px] shrink-0 bg-sky-100 overflow-hidden">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-sky-200 flex items-center justify-center">
                        <span className="text-sky-500 text-[9px] font-bold uppercase text-center px-1">{item.source}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500 block">{item.source}</span>
                    <h4 className="text-[14px] font-bold text-sky-950 leading-snug group-hover:text-sky-600 transition-colors line-clamp-3">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[12px] text-sky-700/80 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Tech Digest — 2-col dense list (msWithImage 10–29) ── */}
        {msWithImage.length > 10 && (
          <section className="mt-12">
            <div className="border-t-[6px] border-sky-500 pt-3 mb-8">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-white bg-sky-500 inline-block px-3 py-1.5 leading-none">
                Tech Digest
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 bg-white border border-sky-100 shadow-sm divide-y lg:divide-y-0 lg:divide-x divide-sky-100">
              <div className="flex flex-col divide-y divide-sky-100">
                {msDigestLeft.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 items-center p-4 hover:bg-sky-50/60 transition-colors"
                  >
                    <div className="w-[80px] h-[60px] shrink-0 bg-sky-100 overflow-hidden">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-sky-200 flex items-center justify-center">
                          <span className="text-sky-500 text-[9px] font-bold uppercase text-center px-1">{item.source}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-sky-500 truncate">{item.source}</span>
                        <span className="text-[9px] text-sky-400 shrink-0">
                          {new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-sky-950 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </a>
                ))}
              </div>
              <div className="flex flex-col divide-y divide-sky-100">
                {msDigestRight.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 items-center p-4 hover:bg-sky-50/60 transition-colors"
                  >
                    <div className="w-[80px] h-[60px] shrink-0 bg-sky-100 overflow-hidden">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-sky-200 flex items-center justify-center">
                          <span className="text-sky-500 text-[9px] font-bold uppercase text-center px-1">{item.source}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-sky-500 truncate">{item.source}</span>
                        <span className="text-[9px] text-sky-400 shrink-0">
                          {new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-sky-950 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}



      </main>
    </div>
  );
}
