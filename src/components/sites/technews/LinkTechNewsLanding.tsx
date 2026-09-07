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
import { getTechNewsTheme, techNewsVars, type TechNewsTheme } from "./theme";
import { SectionLabel, SourceChip } from "./parts";

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => (
    <div className="h-[100px] animate-pulse bg-[var(--tn-accent-soft)] border border-[var(--tn-rule)]" />
  ),
});

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
  domain: string;
  tenantId: string | null;
  articles: ArticleRow[];
  banners: { top: unknown[]; sidebar: unknown[]; footer: unknown[] };
  mediastackArticles?: MediaStackArticle[];
}

function articleHref(a: { slug?: string | null; id: string }) {
  return `/article/${a.slug || a.id}`;
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

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

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
      <div className="w-full h-full bg-[var(--tn-accent-soft)] flex items-center justify-center">
        <span className="text-[var(--tn-muted)] text-[10px] font-bold uppercase px-2 text-center font-mono">
          {label}
        </span>
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setFailed(true)} />
  );
}

function HeadlineCard({
  theme,
  article,
  imgSizes,
  titleClass = "text-[16px]",
}: {
  theme: TechNewsTheme;
  article: ArticleRow | MediaStackArticle;
  imgSizes: string;
  titleClass?: string;
}) {
  const external = isMs(article);
  const imgSrc = external ? article.image : article.imageUrl;
  const label = external ? article.source : article.category?.categoryName ?? "News";
  const body = (
    <>
      <div
        className="relative aspect-[3/2] w-full mb-3 bg-[var(--tn-accent-soft)] overflow-hidden"
        style={{ borderRadius: "var(--tn-radius)" }}
      >
        {external ? (
          imgSrc ? (
            <ExternalThumb
              src={imgSrc}
              alt={article.title}
              label={label}
              sizes={imgSizes}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[var(--tn-muted)] text-[10px] font-bold uppercase px-2 text-center font-mono">
                {label}
              </span>
            </div>
          )
        ) : (
          <StoryImage
            src={imgSrc}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes={imgSizes}
          />
        )}
      </div>
      {external && theme.sourceChips ? (
        <SourceChip source={article.sourceDomain || article.source} className="mb-1" />
      ) : (
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)] mb-1">
          {label}
        </span>
      )}
      <h3
        className={`font-serif font-bold text-[var(--tn-ink)] leading-tight group-hover:text-[var(--tn-accent)] transition-colors ${titleClass}`}
      >
        {article.title}
      </h3>
    </>
  );
  return external ? (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-[var(--tn-rule)] pb-6 last:border-0"
    >
      {body}
    </a>
  ) : (
    <Link
      href={articleHref(article)}
      className="group block border-b border-[var(--tn-rule)] pb-6 last:border-0"
    >
      {body}
    </Link>
  );
}

export default function LinkTechNewsLanding({ domain, articles, banners, mediastackArticles = [] }: Props) {
  const theme = getTechNewsTheme(domain);
  const categories = getCoreCategories(domain);
  const canonicalCategoryMap = new Map(
    categories.map((c) => [normalizeCategoryKey(c), c.trim()]),
  );

  const sorted = [...articles].sort((a, b) => {
    const ah = a.isHeadline ? 1 : 0;
    const bh = b.isHeadline ? 1 : 0;
    if (bh !== ah) return bh - ah;
    if ((b.trendingScore ?? 0) !== (a.trendingScore ?? 0)) {
      return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const hero = sorted[0];
  const dbSecondary = sorted.slice(1, 6);
  const dbTrending = sorted.slice(6, 11);
  const dbCenter = sorted.slice(11, 16);

  const msWithImage = mediastackArticles.filter((a) => cleanImage(a.image) !== null);
  const msNoImageOk = mediastackArticles; // rail can show headline-only
  const railItems = msNoImageOk.slice(0, 22);
  const msDigest = msWithImage.slice(8, 26);
  const msFeed = msWithImage.slice(0, 8);

  const msFallback = msWithImage.slice(26);
  let fb = 0;
  const secondary: (ArticleRow | MediaStackArticle)[] = [...dbSecondary];
  while (secondary.length < 5 && fb < msFallback.length) secondary.push(msFallback[fb++]);
  const trending: (ArticleRow | MediaStackArticle)[] = [...dbTrending];
  while (trending.length < 5 && fb < msFallback.length) trending.push(msFallback[fb++]);
  const centerRows: (ArticleRow | MediaStackArticle)[] = [...dbCenter];
  while (centerRows.length < 5 && fb < msFallback.length) centerRows.push(msFallback[fb++]);

  const usedIds = new Set([
    hero?.id,
    ...dbSecondary.map((a) => a.id),
    ...dbTrending.map((a) => a.id),
    ...dbCenter.map((a) => a.id),
  ]);

  const groupedMap = new Map<string, ArticleRow[]>();
  for (const a of sorted) {
    if (usedIds.has(a.id)) continue;
    const raw = a.category?.categoryName || "Uncategorized";
    const cat = canonicalCategoryMap.get(normalizeCategoryKey(raw)) ?? raw;
    if (!groupedMap.has(cat)) groupedMap.set(cat, []);
    groupedMap.get(cat)!.push(a);
  }
  const grouped = Array.from(groupedMap.entries()).map(([name, items]) => ({ name, items }));

  if (!theme) return null;

  const ad = ADSTERRA_CONFIG[theme.key]?.banners;

  const leaderAd = ad ? (
    <div className="flex justify-center py-5 border-y border-[var(--tn-rule)] bg-[var(--tn-accent-soft)]/40">
      <div className="hidden sm:block">
        <AdsterraBanner
          bannerKey={ad["728x90"] || ad["468x60"]}
          width={ad["728x90"] ? 728 : 468}
          height={ad["728x90"] ? 90 : 60}
          className="!my-0"
        />
      </div>
      <div className="block sm:hidden">
        <AdsterraBanner bannerKey={ad["320x50"]} width={320} height={50} className="!my-0" />
      </div>
    </div>
  ) : null;

  return (
    <div style={techNewsVars(theme)} className="min-h-screen bg-[var(--tn-bg)] text-[var(--tn-ink)]">
      {banners.top && banners.top.length > 0 ? (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 border-b border-[var(--tn-rule)] mb-8">
          <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
        </div>
      ) : (
        <div className="border-b border-[var(--tn-rule)] mb-8">{leaderAd}</div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Left rail — the signature "wire" column */}
          {theme.railLabel && railItems.length > 0 && (
            <aside className="lg:col-span-3 order-2 lg:order-1">
              <div className="border-t-2 border-[var(--tn-ink)] pt-3 mb-5">
                <SectionLabel theme={theme}>{theme.railLabel}</SectionLabel>
              </div>
              <ol className="flex flex-col divide-y divide-[var(--tn-rule)] border-l border-[var(--tn-rule)]">
                {railItems.map((item, i) => (
                  <li key={item.id} className="pl-3 py-2.5 relative">
                    <span
                      className={`absolute -left-[3.5px] top-3.5 w-1.5 h-1.5 ${
                        i === 0 ? "bg-[var(--tn-accent)] animate-tn-pulse" : "bg-[var(--tn-rule)]"
                      }`}
                      aria-hidden
                    />
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <span className="font-mono text-[10px] text-[var(--tn-muted)] tabular-nums">
                        {timeLabel(item.publishedAt)} · {(item.sourceDomain || item.source).replace(/^www\./, "")}
                      </span>
                      <span className="block text-[13px] font-medium leading-snug text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                        {item.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </aside>
          )}

          {/* Center — lead story */}
          <section
            className={theme.railLabel ? "lg:col-span-6 order-1 lg:order-2" : "lg:col-span-8 order-1"}
          >
            {hero ? (
              <article className="flex flex-col">
                <SectionLabel theme={theme} className="mb-4">
                  {hero.category?.categoryName ?? "Lead Story"}
                </SectionLabel>
                <Link href={articleHref(hero)} className="group block mb-4">
                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.1rem] font-black leading-[1.04] tracking-tight text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors">
                    {hero.title}
                  </h1>
                </Link>
                <p className="text-lg text-[var(--tn-muted)] max-w-2xl mb-5 leading-relaxed">
                  {excerpt(hero.content, 190)}
                </p>
                <div
                  className="w-full relative aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden mb-6"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
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

                {ad && (
                  <div className="w-full flex justify-center border-t border-[var(--tn-rule)] pt-4 mb-6">
                    <div className="hidden sm:block">
                      <AdsterraBanner
                        bannerKey={ad["468x60"] || ad["728x90"]}
                        width={468}
                        height={60}
                        className="!my-0"
                      />
                    </div>
                    <div className="block sm:hidden">
                      <AdsterraBanner bannerKey={ad["320x50"]} width={320} height={50} className="!my-0" />
                    </div>
                  </div>
                )}

                {centerRows.length > 0 && (
                  <div className="w-full flex flex-col divide-y divide-[var(--tn-rule)] border-t border-[var(--tn-rule)]">
                    {centerRows.map((article) => {
                      const external = isMs(article);
                      const imgSrc = external ? article.image : article.imageUrl;
                      const label = external
                        ? article.source
                        : article.category?.categoryName ?? "News";
                      const desc = external ? article.description : excerpt(article.content, 100);
                      const rowBody = (
                        <>
                          <div
                            className="relative w-[150px] h-[100px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden"
                            style={{ borderRadius: "var(--tn-radius)" }}
                          >
                            {external ? (
                              imgSrc ? (
                                <ExternalThumb
                                  src={imgSrc}
                                  alt={article.title}
                                  label={label}
                                  sizes="150px"
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-[var(--tn-muted)] text-[10px] font-bold uppercase px-2 text-center font-mono">
                                    {label}
                                  </span>
                                </div>
                              )
                            ) : (
                              <StoryImage
                                src={imgSrc}
                                alt={article.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="150px"
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                            {external && theme!.sourceChips ? (
                              <SourceChip source={article.sourceDomain || article.source} />
                            ) : (
                              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)]">
                                {label}
                              </span>
                            )}
                            <h3 className="font-serif text-[17px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                              {article.title}
                            </h3>
                            {desc && (
                              <p className="text-[13px] text-[var(--tn-muted)] leading-snug line-clamp-2">
                                {desc}
                              </p>
                            )}
                          </div>
                        </>
                      );
                      return external ? (
                        <a
                          key={article.id}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex gap-5 items-center py-5 hover:bg-[var(--tn-accent-soft)]/40 transition-colors"
                        >
                          {rowBody}
                        </a>
                      ) : (
                        <Link
                          key={article.id}
                          href={articleHref(article)}
                          className="group flex gap-5 items-center py-5 hover:bg-[var(--tn-accent-soft)]/40 transition-colors"
                        >
                          {rowBody}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </article>
            ) : (
              <div className="border-t-2 border-[var(--tn-ink)] pt-16 text-center">
                <p className="text-[var(--tn-muted)] font-medium text-xl">No published articles yet.</p>
                <p className="text-sm text-[var(--tn-muted)] mt-2">
                  Check back soon for the latest from {theme.name}.
                </p>
              </div>
            )}
          </section>

          {/* Right — ranked list */}
          <aside className="lg:col-span-3 order-3">
            <div className="border-t-2 border-[var(--tn-ink)] pt-3 mb-5">
              <SectionLabel theme={theme}>Most Read</SectionLabel>
            </div>
            <ol className="flex flex-col">
              {trending.map((article, i) => {
                const external = isMs(article);
                const label = external
                  ? article.source
                  : article.category?.categoryName ?? "News";
                const inner = (
                  <>
                    <span className="font-mono text-[22px] font-black leading-none w-8 shrink-0 text-[var(--tn-rule)] group-hover:text-[var(--tn-accent)] transition-colors tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)] mb-1">
                        {label}
                      </span>
                      <h4 className="font-serif text-[15px] font-bold text-[var(--tn-ink)] leading-tight group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">
                        {article.title}
                      </h4>
                    </div>
                  </>
                );
                return external ? (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 items-start border-b border-[var(--tn-rule)] py-4 last:border-0"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={article.id}
                    href={articleHref(article)}
                    className="group flex gap-3 items-start border-b border-[var(--tn-rule)] py-4 last:border-0"
                  >
                    {inner}
                  </Link>
                );
              })}
            </ol>
            {ad?.["300x250"] && (
              <div className="mt-8 flex justify-center border-t border-[var(--tn-rule)] pt-6">
                <AdsterraBanner bannerKey={ad["300x250"]} width={300} height={250} className="!my-0" />
              </div>
            )}
          </aside>
        </div>

        {/* Secondary lead strip */}
        {secondary.length > 0 && (
          <section className="mt-14">
            <div className="border-t-2 border-[var(--tn-ink)] pt-3 mb-6">
              <SectionLabel theme={theme}>More Headlines</SectionLabel>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-6">
              {secondary.map((article) => (
                <HeadlineCard
                  key={article.id}
                  theme={theme}
                  article={article}
                  imgSizes="(max-width: 1024px) 50vw, 20vw"
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">{leaderAd}</div>

        {/* Category blocks */}
        {grouped.map((group) => {
          const lead = group.items[0];
          const rest = group.items.slice(1, 5);
          if (!lead) return null;
          return (
            <section key={group.name} className="mt-14">
              <div className="border-t-4 border-[var(--tn-ink)] pt-3 mb-8">
                <SectionLabel theme={theme}>{group.name}</SectionLabel>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-8">
                <div
                  className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto lg:h-[400px] overflow-hidden bg-[var(--tn-accent-soft)] group"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
                  <Link href={articleHref(lead)} className="block w-full h-full">
                    <StoryImage
                      src={lead.imageUrl}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={lead.title}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                    />
                  </Link>
                </div>
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--tn-muted)] mb-3">
                    {lead.category?.categoryName}
                  </span>
                  <Link href={articleHref(lead)} className="block mb-3 group">
                    <h3 className="font-serif text-3xl lg:text-[2.3rem] font-black leading-[1.06] tracking-tight text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors">
                      {lead.title}
                    </h3>
                  </Link>
                  <p className="text-base text-[var(--tn-muted)] mb-4 leading-relaxed">
                    {excerpt(lead.content, 180)}
                  </p>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-ink)]">
                    By {theme.byline}
                  </span>
                </div>
              </div>
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 border-t border-[var(--tn-rule)] pt-6">
                  {rest.map((article) => (
                    <Link
                      href={articleHref(article)}
                      key={article.id}
                      className="group flex gap-3 items-start"
                    >
                      <div
                        className="relative w-[76px] h-[76px] bg-[var(--tn-accent-soft)] overflow-hidden shrink-0"
                        style={{ borderRadius: "var(--tn-radius)" }}
                      >
                        <StoryImage
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="76px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--tn-muted)] mb-1 leading-none">
                          {article.category?.categoryName}
                        </span>
                        <h4 className="font-serif text-[14px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">
                          {article.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* From the Feed — mediastack grid */}
        {msFeed.length > 0 && (
          <section className="mt-14">
            <div className="border-t-4 border-[var(--tn-accent)] pt-3 mb-8">
              <SectionLabel theme={theme}>From the Feed</SectionLabel>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {msFeed.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-[var(--tn-surface)] border border-[var(--tn-rule)] hover:border-[var(--tn-accent)] transition-colors"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
                  <div className="relative aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[var(--tn-muted)] text-[10px] font-bold uppercase px-2 text-center font-mono">
                          {item.source}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    {theme.sourceChips ? (
                      <SourceChip source={item.sourceDomain || item.source} />
                    ) : (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)]">
                        {item.source}
                      </span>
                    )}
                    <h3 className="font-serif text-[15px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3 flex-1">
                      {item.title}
                    </h3>
                    <span className="font-mono text-[10px] text-[var(--tn-muted)]">
                      {new Date(item.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Digest — dense 2-col list */}
        {msDigest.length > 0 && (
          <section className="mt-14">
            <div className="border-t-4 border-[var(--tn-ink)] pt-3 mb-8">
              <SectionLabel theme={theme}>The Digest</SectionLabel>
            </div>
            <div
              className="grid grid-cols-1 lg:grid-cols-2 bg-[var(--tn-surface)] border border-[var(--tn-rule)] divide-y lg:divide-y-0 lg:divide-x divide-[var(--tn-rule)]"
              style={{ borderRadius: "var(--tn-radius)" }}
            >
              {[msDigest.slice(0, Math.ceil(msDigest.length / 2)), msDigest.slice(Math.ceil(msDigest.length / 2))].map(
                (col, ci) => (
                  <div key={ci} className="flex flex-col divide-y divide-[var(--tn-rule)]">
                    {col.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex gap-3 items-center p-4 hover:bg-[var(--tn-accent-soft)]/50 transition-colors"
                      >
                        <div className="w-[76px] h-[56px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[var(--tn-muted)] text-[9px] font-bold uppercase text-center px-1 font-mono">
                                {item.source}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)] truncate">
                            {(item.sourceDomain || item.source).replace(/^www\./, "")} ·{" "}
                            {new Date(item.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <h4 className="font-serif text-[13px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                        </div>
                      </a>
                    ))}
                  </div>
                ),
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
