"use client";

import { AdBanner } from "@/components/AdBanner";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { StoryImage } from "@/components/StoryImage";
import type { MediaStackArticle } from "@/lib/mediastack";
import { getTechNewsTheme, techNewsVars } from "../technews-shared/theme";
import { toFeedRows, excerpt, type FeedRow } from "../technews-shared/feed";
import { FeedLink } from "../technews-shared/FeedLink";

interface Props {
  domain: string;
  tenantId: string | null;
  articles: Parameters<typeof toFeedRows>[0];
  banners: { top: unknown[]; sidebar: unknown[]; footer: unknown[] };
  mediastackArticles?: MediaStackArticle[];
}

function readTime(text: string | null | undefined): number {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function catOf(r: FeedRow) {
  return r.source ?? r.category?.categoryName ?? "tech";
}

function Marker({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className={`font-mono text-[13px] font-bold ${accent ? "text-[var(--tn-accent)]" : "text-[var(--tn-ink)]"}`}>&gt;</span>
      <h2 className="font-mono text-[11px] font-bold text-[var(--tn-ink)] uppercase tracking-[0.24em]">{children}</h2>
      <span className="flex-1 h-px bg-[var(--tn-rule)]" />
    </div>
  );
}

export default function DbTechNewsLanding({ domain, articles, banners, mediastackArticles = [] }: Props) {
  const theme = getTechNewsTheme(domain);
  const rows = toFeedRows(articles, mediastackArticles, { requireImage: false });
  const pool = rows.filter((r) => r.imageUrl !== null || !r.external);

  const hero = pool[0] ?? null;
  const body = pool.slice(1);

  const sidebarItems = body.slice(0, 4);
  const weeklyCards = body.slice(4, 7);
  const moreGrid = body.slice(7, 11);
  const commitList = body.slice(11, 21);
  const dontMiss = body.slice(21, 27);
  const darkBand = body.slice(27, 30);

  if (!theme) return null;
  const b = ADSTERRA_CONFIG[theme.key]?.banners;

  if (!hero && pool.length === 0) {
    return (
      <div style={techNewsVars(theme)} className="min-h-[60vh] bg-[var(--tn-bg)] flex items-center justify-center px-4">
        <div className="text-center font-mono">
          <p className="text-lg font-bold text-[var(--tn-ink)] mb-2">$ no records</p>
          <p className="text-sm text-[var(--tn-muted)]">The feed populates shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={techNewsVars(theme)} className="bg-[var(--tn-bg)] text-[var(--tn-ink)] min-h-screen font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
      </div>
      {b && (
        <div className="w-full flex justify-center py-3 overflow-hidden">
          <div className="hidden sm:block">
            <AdsterraBanner bannerKey={b["728x90"] || b["468x60"]} width={b["728x90"] ? 728 : 468} height={b["728x90"] ? 90 : 60} className="!my-0" />
          </div>
          <div className="block sm:hidden">
            <AdsterraBanner bannerKey={b["320x50"]} width={320} height={50} className="!my-0" />
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            {hero && (
              <FeedLink
                row={hero}
                className="group block"
                style={{
                  position: "relative",
                  display: "block",
                  width: "100%",
                  height: "clamp(240px, 38vw, 420px)",
                  overflow: "hidden",
                  borderRadius: "var(--tn-radius)",
                  backgroundColor: "var(--tn-ink)",
                  backgroundImage: hero.imageUrl ? `url("${hero.imageUrl}")` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1))",
                  }}
                />
                <div
                  className="flex flex-col justify-between p-6 sm:p-8"
                  style={{ position: "absolute", inset: 0 }}
                >
                  <span className="inline-block self-start bg-[var(--tn-accent)] text-[var(--tn-accent-ink)] font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
                    HEAD
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-3 font-mono">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tn-accent)]">{catOf(hero)}</span>
                      <span className="text-white/45">·</span>
                      <span className="text-[10px] text-white/60">{shortDate(hero.createdAt)}</span>
                    </div>
                    <h2 className="font-serif text-[22px] sm:text-[28px] font-bold text-white leading-tight line-clamp-3 mb-2">{hero.title}</h2>
                    {hero.content && <p className="text-[13px] text-white/70 line-clamp-2 leading-relaxed">{excerpt(hero.content, 160)}</p>}
                  </div>
                </div>
              </FeedLink>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="divide-y divide-[var(--tn-rule)] h-full flex flex-col">
              {sidebarItems.map((item) => (
                <FeedLink key={item.id} row={item} className="group flex gap-4 py-4 first:pt-0 hover:bg-[var(--tn-accent-soft)]/50 -mx-2 px-2 transition-colors">
                  <div className="w-[88px] h-[66px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden relative">
                    <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="88px" />
                  </div>
                  <div className="flex-1 min-w-0 font-mono">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-[var(--tn-muted)]">{shortDate(item.createdAt)}</span>
                      <span className="text-[var(--tn-rule)]">·</span>
                      <span className="text-[9px] font-bold text-[var(--tn-accent)]">{readTime(item.content)} min</span>
                    </div>
                    <h4 className="font-sans text-[13px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">{item.title}</h4>
                  </div>
                </FeedLink>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pinned */}
      {weeklyCards.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-2">
          <Marker accent>Pinned by editors</Marker>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {weeklyCards.map((item) => (
              <FeedLink key={item.id} row={item} className="group block border border-[var(--tn-rule)]" >
                <div className="relative aspect-[4/3] bg-[var(--tn-accent-soft)] overflow-hidden">
                  <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="360px" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 font-mono">
                    <span className="text-[9px] text-[var(--tn-muted)]">{shortDate(item.createdAt)}</span>
                    <span className="text-[var(--tn-rule)]">·</span>
                    <span className="text-[9px] font-bold text-[var(--tn-accent)]">{readTime(item.content)} min</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2 mb-2">{item.title}</h3>
                  {item.content && <p className="text-[12px] text-[var(--tn-muted)] line-clamp-2 leading-relaxed">{excerpt(item.content, 130)}</p>}
                </div>
              </FeedLink>
            ))}
          </div>
        </div>
      )}

      {/* More */}
      {moreGrid.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-t border-[var(--tn-rule)] pt-10">
          <Marker>More</Marker>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {moreGrid.map((item) => (
              <FeedLink key={item.id} row={item} className="group block">
                <div className="relative aspect-[4/3] bg-[var(--tn-accent-soft)] overflow-hidden mb-3">
                  <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="280px" />
                </div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--tn-accent)] block mb-1">{catOf(item)}</span>
                <h3 className="text-[12px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">{item.title}</h3>
              </FeedLink>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar as never[]} />
      </div>

      {/* Latest Commits — ranked log */}
      {commitList.length > 0 && (
        <div className="bg-[var(--tn-surface)] py-12 border-y border-[var(--tn-rule)]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4 mb-8 border-b-2 border-[var(--tn-ink)] pb-4">
              <h2 className="font-serif text-[22px] font-bold text-[var(--tn-ink)]">Latest Commits</h2>
              <p className="font-mono text-[var(--tn-muted)] text-[12px] hidden sm:block">most recent first</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-12">
              {[commitList.slice(0, Math.ceil(commitList.length / 2)), commitList.slice(Math.ceil(commitList.length / 2))].map((column, colIdx) => (
                <div key={colIdx} className={`divide-y divide-[var(--tn-rule)] ${colIdx === 1 ? "lg:border-l lg:border-[var(--tn-rule)] lg:pl-12" : ""}`}>
                  {column.map((item, i) => {
                    const rank = colIdx * Math.ceil(commitList.length / 2) + i + 1;
                    return (
                      <FeedLink key={item.id} row={item} className="group flex items-center gap-4 py-4 first:pt-0">
                        <span className="font-mono text-[24px] font-bold text-[var(--tn-rule)] group-hover:text-[var(--tn-accent)] transition-colors w-11 shrink-0 text-right tabular-nums">
                          {String(rank).padStart(2, "0")}
                        </span>
                        <div className="w-[76px] h-[56px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden relative">
                          <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="76px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--tn-accent)] block mb-0.5">{catOf(item)}</span>
                          <h3 className="text-[13px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">{item.title}</h3>
                        </div>
                      </FeedLink>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Don't miss */}
      {dontMiss.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Marker accent>Don&apos;t miss</Marker>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dontMiss.map((item) => (
              <FeedLink key={item.id} row={item} className="group flex gap-4">
                <div className="w-[120px] h-[80px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden relative">
                  <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="120px" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 font-mono">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--tn-accent)]">{catOf(item)}</span>
                    <span className="text-[var(--tn-rule)] text-[9px]">·</span>
                    <span className="text-[9px] text-[var(--tn-muted)]">{shortDate(item.createdAt)}</span>
                  </div>
                  <h3 className="text-[13px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">{item.title}</h3>
                  {item.content && <p className="text-[11px] text-[var(--tn-muted)] line-clamp-1 mt-0.5">{excerpt(item.content, 110)}</p>}
                </div>
              </FeedLink>
            ))}
          </div>
        </div>
      )}

      {/* Systems & Infra — dark band */}
      {darkBand.length > 0 && (
        <div className="bg-[var(--tn-ink)] py-12">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="font-mono text-[13px] font-bold text-[var(--tn-accent)]">&gt;</span>
              <h2 className="font-mono text-[11px] font-bold text-white uppercase tracking-[0.24em]">Systems &amp; Infra</h2>
              <span className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {darkBand.map((item) => (
                <FeedLink key={item.id} row={item} className="group block">
                  <div className="relative aspect-[16/9] bg-white/5 overflow-hidden mb-4">
                    <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" sizes="360px" />
                    <div className="absolute top-3 left-3 bg-[var(--tn-accent)] text-[var(--tn-accent-ink)] font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1">
                      {catOf(item)}
                    </div>
                  </div>
                  <h3 className="text-[14px] font-bold text-white leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3 mb-1">{item.title}</h3>
                  {item.content && <p className="text-[11px] text-white/60 line-clamp-2">{excerpt(item.content, 120)}</p>}
                </FeedLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-[var(--tn-rule)]">
        <AdsterraNativeBanner domain={domain} transparent />
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdBanner position="HOME_FOOTER" initialBanners={banners.footer as never[]} />
      </div>
    </div>
  );
}
