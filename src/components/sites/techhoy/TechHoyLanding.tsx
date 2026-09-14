"use client";

import dynamic from "next/dynamic";
import { StoryImage } from "@/components/StoryImage";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { getCoreCategories, normalizeCategoryKey } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";
import { getTechNewsTheme, techNewsVars, type TechNewsTheme } from "../technews-shared/theme";
import { SectionLabel, SourceChip } from "../technews-shared/parts";
import { toFeedRows, excerpt, type FeedRow } from "../technews-shared/feed";
import { FeedLink } from "../technews-shared/FeedLink";

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => (
    <div className="h-[100px] animate-pulse bg-[var(--tn-accent-soft)] border border-[var(--tn-rule)]" />
  ),
});

interface Props {
  domain: string;
  tenantId: string | null;
  articles: Parameters<typeof toFeedRows>[0];
  banners: { top: unknown[]; sidebar: unknown[]; footer: unknown[] };
  mediastackArticles?: MediaStackArticle[];
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function HeadlineCard({
  theme,
  row,
  imgSizes,
  titleClass = "text-[16px]",
}: {
  theme: TechNewsTheme;
  row: FeedRow;
  imgSizes: string;
  titleClass?: string;
}) {
  const label = row.external ? row.source : row.category?.categoryName ?? "News";
  const desc = excerpt(row.content, 100);
  return (
    <FeedLink row={row} className="group block border-b border-[var(--tn-rule)] pb-6 last:border-0">
      <div
        className="relative aspect-[3/2] w-full mb-3 bg-[var(--tn-accent-soft)] overflow-hidden"
        style={{ borderRadius: "var(--tn-radius)" }}
      >
        <StoryImage
          src={row.imageUrl}
          alt={row.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes={imgSizes}
        />
      </div>
      {row.external && theme.sourceChips ? (
        <SourceChip source={row.source ?? ""} className="mb-1" />
      ) : (
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)] mb-1">
          {label}
        </span>
      )}
      <h3
        className={`font-serif font-bold text-[var(--tn-ink)] leading-tight group-hover:text-[var(--tn-accent)] transition-colors ${titleClass}`}
      >
        {row.title}
      </h3>
      {desc && (
        <p className="text-[13px] text-[var(--tn-muted)] leading-snug line-clamp-2 mt-1.5">
          {desc}
        </p>
      )}
    </FeedLink>
  );
}

export default function TechHoyLanding({ domain, articles, banners, mediastackArticles = [] }: Props) {
  const theme = getTechNewsTheme(domain);
  const categories = getCoreCategories(domain);
  const canonicalCategoryMap = new Map(
    categories.map((c) => [normalizeCategoryKey(c), c.trim()]),
  );

  // Unified pool: DB articles (when editors have published) always rank first,
  // then the MediaStack "technology" feed fills every remaining slot — so the
  // page never collapses to an empty homepage before DB content exists.
  const rows = toFeedRows(articles, mediastackArticles);
  const pool = rows.filter((r) => r.imageUrl !== null || !r.external);

  // Fixed slot boundaries into `pool` — hero, then each section in turn, with
  // whatever's left over feeding the category blocks below.
  const HERO_END = 1;
  const CENTER_END = HERO_END + 5;
  const SECONDARY_END = CENTER_END + 5;
  const TRENDING_END = SECONDARY_END + 5;
  const FEED_END = TRENDING_END + 8;
  const DIGEST_END = FEED_END + 18;

  const hero = pool[0] ?? null;
  const centerRows = pool.slice(HERO_END, CENTER_END);
  const secondary = pool.slice(CENTER_END, SECONDARY_END);
  const trending = pool.slice(SECONDARY_END, TRENDING_END);
  const feedGrid = pool.slice(TRENDING_END, FEED_END);
  const digestList = pool.slice(FEED_END, DIGEST_END);
  const remainder = pool.slice(DIGEST_END);

  // Left rail — freshest headlines ticker, independent of the pool above (a
  // "latest" ticker legitimately overlaps with the main grid on real news sites).
  const railItems = mediastackArticles.slice(0, 22);

  const groupedMap = new Map<string, FeedRow[]>();
  for (const r of remainder) {
    const raw = r.category?.categoryName || "Technology";
    const cat = canonicalCategoryMap.get(normalizeCategoryKey(raw)) ?? raw;
    if (!groupedMap.has(cat)) groupedMap.set(cat, []);
    groupedMap.get(cat)!.push(r);
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
              <div className="mb-5">
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
                <FeedLink row={hero} className="group block mb-4">
                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.1rem] font-black leading-[1.04] tracking-tight text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors">
                    {hero.title}
                  </h1>
                </FeedLink>
                <p className="text-lg text-[var(--tn-muted)] max-w-2xl mb-5 leading-relaxed">
                  {excerpt(hero.content, 190)}
                </p>
                <div
                  className="w-full relative aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden mb-6"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
                  <FeedLink row={hero} className="group block w-full h-full">
                    <StoryImage
                      src={hero.imageUrl}
                      alt={hero.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </FeedLink>
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
                    {centerRows.map((row) => (
                      <FeedLink
                        key={row.id}
                        row={row}
                        className="group flex gap-5 items-center py-5 hover:bg-[var(--tn-accent-soft)]/40 transition-colors"
                      >
                        <div
                          className="relative w-[150px] h-[100px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden"
                          style={{ borderRadius: "var(--tn-radius)" }}
                        >
                          <StoryImage
                            src={row.imageUrl}
                            alt={row.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="150px"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-0 flex-1 justify-center">
                          {row.external && theme!.sourceChips ? (
                            <SourceChip source={row.source ?? ""} />
                          ) : (
                            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)]">
                              {row.category?.categoryName ?? "News"}
                            </span>
                          )}
                          <h3 className="font-serif text-[17px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                            {row.title}
                          </h3>
                          {row.content && (
                            <p className="text-[13px] text-[var(--tn-muted)] leading-snug line-clamp-2">
                              {excerpt(row.content, 100)}
                            </p>
                          )}
                        </div>
                      </FeedLink>
                    ))}
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
            <div className="mb-5">
              <SectionLabel theme={theme}>Most Read</SectionLabel>
            </div>
            <ol className="flex flex-col gap-5">
              {trending.map((row, i) => (
                <FeedLink
                  key={row.id}
                  row={row}
                  className={`group flex flex-col gap-2.5 ${
                    i > 0 ? "pt-5 border-t border-[var(--tn-rule)]" : ""
                  }`}
                >
                  <div
                    className="relative aspect-[16/9] w-full bg-[var(--tn-accent-soft)] overflow-hidden"
                    style={{ borderRadius: "var(--tn-radius)" }}
                  >
                    <StoryImage
                      src={row.imageUrl}
                      alt={row.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 1024px) 50vw, 300px"
                    />
                    <span className="absolute top-2 left-2 flex items-center justify-center w-7 h-7 bg-[var(--tn-ink)] text-[var(--tn-bg)] font-mono text-[13px] font-black tabular-nums">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)] mb-1">
                      {row.external ? row.source : row.category?.categoryName ?? "News"}
                    </span>
                    <h4 className="font-serif text-[15px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                      {row.title}
                    </h4>
                  </div>
                </FeedLink>
              ))}
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
            <div className="mb-6">
              <SectionLabel theme={theme}>More Headlines</SectionLabel>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-6">
              {secondary.map((row) => (
                <HeadlineCard
                  key={row.id}
                  theme={theme}
                  row={row}
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
              <div className="mb-8">
                <SectionLabel theme={theme}>{group.name}</SectionLabel>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-8">
                <div
                  className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto lg:h-[400px] overflow-hidden bg-[var(--tn-accent-soft)] group"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
                  <FeedLink row={lead} className="block w-full h-full">
                    <StoryImage
                      src={lead.imageUrl}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={lead.title}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                    />
                  </FeedLink>
                </div>
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--tn-muted)] mb-3">
                    {lead.category?.categoryName}
                  </span>
                  <FeedLink row={lead} className="block mb-3 group">
                    <h3 className="font-serif text-3xl lg:text-[2.3rem] font-black leading-[1.06] tracking-tight text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors">
                      {lead.title}
                    </h3>
                  </FeedLink>
                  <p className="text-base text-[var(--tn-muted)] mb-4 leading-relaxed">
                    {excerpt(lead.content, 180)}
                  </p>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-ink)]">
                    {lead.external ? `Via ${lead.source}` : `By ${theme.byline}`}
                  </span>
                </div>
              </div>
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 border-t border-[var(--tn-rule)] pt-6">
                  {rest.map((row) => (
                    <FeedLink
                      row={row}
                      key={row.id}
                      className="group flex gap-3 items-start"
                    >
                      <div
                        className="relative w-[76px] h-[76px] bg-[var(--tn-accent-soft)] overflow-hidden shrink-0"
                        style={{ borderRadius: "var(--tn-radius)" }}
                      >
                        <StoryImage
                          src={row.imageUrl}
                          alt={row.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="76px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--tn-muted)] mb-1 leading-none">
                          {row.category?.categoryName}
                        </span>
                        <h4 className="font-serif text-[14px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">
                          {row.title}
                        </h4>
                      </div>
                    </FeedLink>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* From the Feed — mediastack grid */}
        {feedGrid.length > 0 && (
          <section className="mt-14">
            <div className="mb-8">
              <SectionLabel theme={theme}>From the Feed</SectionLabel>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {feedGrid.map((row) => (
                <FeedLink
                  key={row.id}
                  row={row}
                  className="group flex flex-col bg-[var(--tn-surface)] border border-[var(--tn-rule)] hover:border-[var(--tn-accent)] transition-colors"
                  style={{ borderRadius: "var(--tn-radius)" }}
                >
                  <div className="relative aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden">
                    <StoryImage
                      src={row.imageUrl}
                      alt={row.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    {row.external && theme.sourceChips ? (
                      <SourceChip source={row.source ?? ""} />
                    ) : (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)]">
                        {row.external ? row.source : row.category?.categoryName}
                      </span>
                    )}
                    <h3 className="font-serif text-[15px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3 flex-1">
                      {row.title}
                    </h3>
                    {row.content && (
                      <p className="text-[12px] text-[var(--tn-muted)] leading-snug line-clamp-2">
                        {excerpt(row.content, 110)}
                      </p>
                    )}
                    <span className="font-mono text-[10px] text-[var(--tn-muted)]">
                      {new Date(row.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </FeedLink>
              ))}
            </div>
          </section>
        )}

        {/* Digest — dense 2-col list */}
        {digestList.length > 0 && (
          <section className="mt-14">
            <div className="mb-8">
              <SectionLabel theme={theme}>The Digest</SectionLabel>
            </div>
            <div
              className="grid grid-cols-1 lg:grid-cols-2 bg-[var(--tn-surface)] border border-[var(--tn-rule)] divide-y lg:divide-y-0 lg:divide-x divide-[var(--tn-rule)]"
              style={{ borderRadius: "var(--tn-radius)" }}
            >
              {[digestList.slice(0, Math.ceil(digestList.length / 2)), digestList.slice(Math.ceil(digestList.length / 2))].map(
                (col, ci) => (
                  <div key={ci} className="flex flex-col divide-y divide-[var(--tn-rule)]">
                    {col.map((row) => (
                      <FeedLink
                        key={row.id}
                        row={row}
                        className="group flex gap-3 items-center p-4 hover:bg-[var(--tn-accent-soft)]/50 transition-colors"
                      >
                        <div className="relative w-[76px] h-[56px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden">
                          <StoryImage
                            src={row.imageUrl}
                            alt={row.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="76px"
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)] truncate">
                            {(row.source ?? row.category?.categoryName ?? "").toString()} ·{" "}
                            {new Date(row.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <h4 className="font-serif text-[13px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                            {row.title}
                          </h4>
                          {row.content && (
                            <p className="text-[11px] text-[var(--tn-muted)] leading-snug line-clamp-1">
                              {excerpt(row.content, 90)}
                            </p>
                          )}
                        </div>
                      </FeedLink>
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
