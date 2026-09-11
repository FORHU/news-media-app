"use client";

import dynamic from "next/dynamic";
import { StoryImage } from "@/components/StoryImage";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { getCoreCategories, normalizeCategoryKey } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";
import { getTechNewsTheme, techNewsVars } from "../technews-shared/theme";
import { SectionLabel } from "../technews-shared/parts";
import { toFeedRows, excerpt, type FeedRow } from "../technews-shared/feed";
import { FeedLink } from "../technews-shared/FeedLink";

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => (
    <div className="h-[100px] animate-pulse bg-[var(--tn-accent-soft)] rounded-[var(--tn-radius)]" />
  ),
});

interface Props {
  domain: string;
  tenantId: string | null;
  articles: Parameters<typeof toFeedRows>[0];
  banners: { top: unknown[]; sidebar: unknown[]; footer: unknown[] };
  mediastackArticles?: MediaStackArticle[];
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function Card({
  row,
  imgSizes,
  aspect = "aspect-[4/3]",
  titleClass = "text-[15px]",
  showExcerpt = true,
}: {
  row: FeedRow;
  imgSizes: string;
  aspect?: string;
  titleClass?: string;
  showExcerpt?: boolean;
}) {
  const label = row.external ? row.source : row.category?.categoryName ?? "Notizie";
  return (
    <FeedLink
      row={row}
      className="group flex flex-col bg-[var(--tn-surface)] border border-[var(--tn-rule)] rounded-[var(--tn-radius)] overflow-hidden hover:shadow-lg hover:shadow-[var(--tn-accent)]/5 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className={`relative w-full ${aspect} bg-[var(--tn-accent-soft)] overflow-hidden`}>
        <StoryImage
          src={row.imageUrl}
          alt={row.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes={imgSizes}
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--tn-accent)]">
          {label}
        </span>
        <h3 className={`font-sans font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3 ${titleClass}`}>
          {row.title}
        </h3>
        {showExcerpt && row.content && (
          <p className="text-[12.5px] text-[var(--tn-muted)] leading-snug line-clamp-2">
            {excerpt(row.content, 110)}
          </p>
        )}
        <span className="mt-auto text-[10px] font-bold text-[var(--tn-muted)] uppercase tracking-wide pt-1">
          {shortDate(row.createdAt)}
        </span>
      </div>
    </FeedLink>
  );
}

export default function TechOggiLanding({ domain, articles, banners, mediastackArticles = [] }: Props) {
  const theme = getTechNewsTheme(domain);
  const categories = getCoreCategories(domain);
  const canonicalCategoryMap = new Map(
    categories.map((c) => [normalizeCategoryKey(c), c.trim()]),
  );

  // Same clean data plumbing every technews sibling shares: DB articles rank
  // first, MediaStack fills the rest, image-bearing rows only for card slots.
  const rows = toFeedRows(articles, mediastackArticles);
  const pool = rows.filter((r) => r.imageUrl !== null || !r.external);

  const HERO_END = 1;
  const TOP_STORIES_END = HERO_END + 5;
  const TRENDING_END = TOP_STORIES_END + 5;
  const MORE_END = TRENDING_END + 8;

  const hero = pool[0] ?? null;
  const topStories = pool.slice(HERO_END, TOP_STORIES_END);
  const trending = pool.slice(TOP_STORIES_END, TRENDING_END);
  const moreGrid = pool.slice(TRENDING_END, MORE_END);
  const remainder = pool.slice(MORE_END);

  // "Il Filo di Oggi" — headline-only ticker, independent of the card pool above.
  const wireItems = mediastackArticles.slice(0, 18);

  const groupedMap = new Map<string, FeedRow[]>();
  for (const r of remainder) {
    const raw = r.category?.categoryName || "Tecnologia";
    const cat = canonicalCategoryMap.get(normalizeCategoryKey(raw)) ?? raw;
    if (!groupedMap.has(cat)) groupedMap.set(cat, []);
    groupedMap.get(cat)!.push(r);
  }
  const grouped = Array.from(groupedMap.entries()).map(([name, items]) => ({ name, items }));

  if (!theme) return null;

  const ad = ADSTERRA_CONFIG[theme.key]?.banners;

  return (
    <div style={techNewsVars(theme)} className="min-h-screen bg-[var(--tn-bg)] text-[var(--tn-ink)]">
      {banners.top && banners.top.length > 0 ? (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6">
          <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
        </div>
      ) : ad ? (
        <div className="flex justify-center py-4">
          <div className="hidden sm:block">
            <AdsterraBanner bannerKey={ad["728x90"] || ad["468x60"]} width={ad["728x90"] ? 728 : 468} height={ad["728x90"] ? 90 : 60} className="!my-0" />
          </div>
          <div className="block sm:hidden">
            <AdsterraBanner bannerKey={ad["320x50"]} width={320} height={50} className="!my-0" />
          </div>
        </div>
      ) : null}

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main column — hero + top stories card grid */}
          <section className="lg:col-span-8">
            {hero ? (
              <>
                <FeedLink row={hero} className="group block">
                  <div
                    className="relative w-full aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden mb-5"
                    style={{ borderRadius: "var(--tn-radius)" }}
                  >
                    <StoryImage
                      src={hero.imageUrl}
                      alt={hero.title}
                      fill
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--tn-accent)]" aria-hidden />
                        {hero.category?.categoryName ?? "Notizia Principale"}
                      </span>
                      <h1 className="font-sans text-2xl sm:text-4xl font-black text-white leading-[1.08] tracking-tight max-w-2xl">
                        {hero.title}
                      </h1>
                    </div>
                  </div>
                </FeedLink>
                <p className="text-[15px] text-[var(--tn-muted)] leading-relaxed max-w-2xl mb-8">
                  {excerpt(hero.content, 220)}
                </p>
              </>
            ) : (
              <div className="rounded-[var(--tn-radius)] border-2 border-dashed border-[var(--tn-rule)] py-16 text-center mb-8">
                <p className="text-[var(--tn-muted)] font-medium text-lg">Nessun articolo pubblicato ancora.</p>
                <p className="text-sm text-[var(--tn-muted)] mt-2">Torna presto per le ultime novità da {theme.name}.</p>
              </div>
            )}

            {topStories.length > 0 && (
              <section className="mb-10">
                <SectionLabel theme={theme} className="mb-5">Notizie Principali</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {topStories.map((row) => (
                    <Card key={row.id} row={row} imgSizes="(max-width: 1024px) 50vw, 33vw" />
                  ))}
                </div>
              </section>
            )}

            {ad?.["468x60"] && (
              <div className="flex justify-center py-4 mb-10 border-y border-[var(--tn-rule)]">
                <AdsterraBanner bannerKey={ad["468x60"]} width={468} height={60} className="!my-0" />
              </div>
            )}

            {moreGrid.length > 0 && (
              <section className="mb-10">
                <SectionLabel theme={theme} className="mb-5">Altre Notizie</SectionLabel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {moreGrid.map((row) => (
                    <Card
                      key={row.id}
                      row={row}
                      imgSizes="(max-width: 1024px) 50vw, 22vw"
                      aspect="aspect-square"
                      titleClass="text-[13px]"
                      showExcerpt={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </section>

          {/* Right rail — Più Letti numbered list + Il Filo di Oggi ticker */}
          <aside className="lg:col-span-4 flex flex-col gap-10">
            {trending.length > 0 && (
              <div>
                <SectionLabel theme={theme} className="mb-5">Più Letti</SectionLabel>
                <ol className="flex flex-col divide-y divide-[var(--tn-rule)]">
                  {trending.map((row, i) => (
                    <FeedLink
                      key={row.id}
                      row={row}
                      className="group flex gap-3 items-center py-3.5 first:pt-0 hover:bg-[var(--tn-accent-soft)]/40 transition-colors rounded-[var(--tn-radius)] px-2 -mx-2"
                    >
                      <span className="font-sans text-[20px] font-black text-[var(--tn-rule)] group-hover:text-[var(--tn-accent)] transition-colors w-7 shrink-0 text-center tabular-nums">
                        {i + 1}
                      </span>
                      <div
                        className="relative w-14 h-14 shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden"
                        style={{ borderRadius: "var(--tn-radius)" }}
                      >
                        <StoryImage
                          src={row.imageUrl}
                          alt={row.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <h4 className="flex-1 min-w-0 font-sans text-[13px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                        {row.title}
                      </h4>
                    </FeedLink>
                  ))}
                </ol>
              </div>
            )}

            {ad?.["300x250"] && (
              <div className="flex justify-center">
                <AdsterraBanner bannerKey={ad["300x250"]} width={300} height={250} className="!my-0" />
              </div>
            )}

            {theme.railLabel && wireItems.length > 0 && (
              <div>
                <SectionLabel theme={theme} className="mb-5">{theme.railLabel}</SectionLabel>
                <ol className="flex flex-col bg-[var(--tn-surface)] border border-[var(--tn-rule)] divide-y divide-[var(--tn-rule)]" style={{ borderRadius: "var(--tn-radius)" }}>
                  {wireItems.map((item, i) => (
                    <li key={item.id} className="px-4 py-3">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? "bg-[var(--tn-accent)] animate-tn-pulse" : "bg-[var(--tn-rule)]"}`}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <span className="block font-mono text-[9.5px] text-[var(--tn-muted)] tabular-nums mb-0.5">
                            {timeLabel(item.publishedAt)} · {(item.sourceDomain || item.source).replace(/^www\./, "")}
                          </span>
                          <span className="block text-[12.5px] font-semibold leading-snug text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                            {item.title}
                          </span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>
        </div>

        {/* Category-grouped sections from whatever's left */}
        {grouped.map((group) => {
          const items = group.items.slice(0, 4);
          if (items.length === 0) return null;
          return (
            <section key={group.name} className="mt-12 pt-10 border-t border-[var(--tn-rule)]">
              <SectionLabel theme={theme} className="mb-5">{group.name}</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {items.map((row) => (
                  <Card key={row.id} row={row} imgSizes="(max-width: 1024px) 50vw, 25vw" />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
