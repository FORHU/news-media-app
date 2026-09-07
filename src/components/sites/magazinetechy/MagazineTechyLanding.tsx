"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { CSSProperties, ReactNode } from "react";
import { StoryImage } from "@/components/StoryImage";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { getCoreCategories } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";
import { getTechNewsTheme, techNewsVars } from "../technews-shared/theme";
import { toFeedRows, excerpt, type FeedRow } from "../technews-shared/feed";
import { FeedLink } from "../technews-shared/FeedLink";

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => <div className="h-[90px] animate-pulse" style={{ background: "var(--tn-accent-soft)" }} />,
});

interface Props {
  domain: string;
  tenantId: string | null;
  articles: Parameters<typeof toFeedRows>[0];
  banners: { top: unknown[]; sidebar: unknown[]; footer: unknown[] };
  mediastackArticles?: MediaStackArticle[];
}

const INK = "var(--tn-ink)";
const ACCENT = "var(--tn-accent)";
const PAPER = "var(--tn-bg)";
const PANEL = "var(--tn-accent-soft)";
const RULE = "var(--tn-rule)";
const MUTED = "var(--tn-muted)";

function readingMinutes(content?: string | null) {
  const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.26em", color: ACCENT }}>
      {children}
    </span>
  );
}

function CoverImage({ row, aspect }: { row: FeedRow; aspect: string }) {
  return (
    <div className="relative w-full overflow-hidden max-h-[70vh]" style={{ aspectRatio: aspect, background: PANEL }}>
      <StoryImage src={row.imageUrl} alt={row.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 1200px" />
      {row.source && (
        <span
          className="absolute bottom-2.5 right-2.5 text-[9px] font-bold uppercase px-2 py-1"
          style={{ letterSpacing: "0.14em", color: "#fff", background: "rgba(0,0,0,0.6)" }}
        >
          {row.source}
        </span>
      )}
    </div>
  );
}

function LinkBody({
  row,
  className,
  style,
  children,
}: {
  row: FeedRow;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <FeedLink row={row} className={className}>
      <span style={style}>{children}</span>
    </FeedLink>
  );
}

export default function MagazineTechyLanding({ domain, articles, banners, mediastackArticles = [] }: Props) {
  const theme = getTechNewsTheme(domain);
  const rows = toFeedRows(articles, mediastackArticles);

  const byline = theme?.byline ?? "MAGAZINE TECHY";

  if (!theme) return null;
  const adKeys = ADSTERRA_CONFIG[theme.key]?.banners;

  if (rows.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 font-sans" style={{ background: PAPER, ...techNewsVars(theme) }}>
        <div className="text-center">
          <p className="text-xl font-serif font-semibold mb-2" style={{ color: INK }}>The issue is at the printer.</p>
          <p className="text-sm mt-1" style={{ color: MUTED }}>New features land here shortly.</p>
        </div>
      </div>
    );
  }

  const lead = rows[0];
  const alsoThisMorning = rows.slice(1, 3);
  const usedIds = new Set([lead.id, ...alsoThisMorning.map((a) => a.id)]);

  const latestPool = rows.filter((a) => !usedIds.has(a.id));
  const latest = latestPool.slice(0, 5);
  latest.forEach((a) => usedIds.add(a.id));

  const mostRead = [...rows]
    .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
    .slice(0, 5);

  const categories = getCoreCategories(domain);
  const feature = rows.find((a) => !usedIds.has(a.id)) ?? rows[0];
  const featureSeries = rows.filter((a) => a.id !== feature.id).slice(0, 3);

  const essays = rows.filter((a) => !usedIds.has(a.id) && a.id !== feature.id).slice(0, 3);

  return (
    <div className="font-sans" style={{ background: PAPER, color: INK, minHeight: "100vh", ...techNewsVars(theme) }}>
      <div className="max-w-[1340px] mx-auto px-4 sm:px-7 pt-4 flex flex-col items-center gap-3">
        <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
        {adKeys?.["728x90"] && (
          <>
            <div className="hidden sm:block">
              <AdsterraBanner bannerKey={adKeys["728x90"]} width={728} height={90} />
            </div>
            {adKeys["320x50"] && (
              <div className="block sm:hidden">
                <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} />
              </div>
            )}
          </>
        )}
      </div>

      <main className="max-w-[1340px] mx-auto px-4 sm:px-7">
        {/* Cover feature */}
        <section className="pt-11">
          <FeedLink row={lead} className="block">
            <CoverImage row={lead} aspect="21/9" />
          </FeedLink>

          <div className="flex flex-wrap pt-8" style={{ gap: 40 }}>
            <div className="flex-1 min-w-0" style={{ flexBasis: 600 }}>
              <div className="flex items-center gap-3.5">
                <Kicker>{lead.category?.categoryName}</Kicker>
                <span className="flex-1 h-px" style={{ background: ACCENT }} />
              </div>
              <FeedLink row={lead}>
                <h1
                  className="font-serif font-semibold m-0 mt-5"
                  style={{ fontSize: "clamp(32px,4.6vw,58px)", lineHeight: 1.05, letterSpacing: "-0.01em", color: INK }}
                >
                  {lead.title}
                </h1>
              </FeedLink>
              {lead.content && (
                <p className="text-[19px] leading-[1.6] max-w-[58ch] mt-5" style={{ color: MUTED }}>
                  {excerpt(lead.content, 240)}
                </p>
              )}
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-5 pt-4 text-[11px] uppercase"
                style={{ letterSpacing: "0.12em", color: MUTED, borderTop: `1px solid ${RULE}` }}
              >
                <span style={{ color: INK, fontWeight: 600 }}>By {lead.source ?? byline}</span>
                <span className="w-px h-2.5" style={{ background: RULE }} />
                <span>{formatDate(lead.createdAt)}</span>
                <span className="w-px h-2.5" style={{ background: RULE }} />
                <span>{readingMinutes(lead.content)} min read</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-6" style={{ flexBasis: 290 }}>
              <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 18 }}>
                <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.26em", color: ACCENT }}>
                  Also in this issue
                </div>
              </div>
              {alsoThisMorning.map((article, i) => (
                <div key={article.id} style={i > 0 ? { borderTop: `1px solid ${RULE}`, paddingTop: 22 } : undefined}>
                  <FeedLink row={article}>
                    <h2 className="font-serif font-semibold m-0" style={{ fontSize: 22, lineHeight: 1.24, color: INK }}>
                      {article.title}
                    </h2>
                  </FeedLink>
                  <div className="mt-2.5 text-[10.5px] uppercase" style={{ letterSpacing: "0.12em", color: MUTED }}>
                    {(article.source ?? byline)} · {readingMinutes(article.content)} min
                  </div>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 22 }}>
                <div style={{ borderLeft: `2px solid ${ACCENT}`, paddingLeft: 14 }}>
                  <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: ACCENT }}>
                    Editor&apos;s note
                  </div>
                  <div className="font-serif mt-2" style={{ fontSize: 18, lineHeight: 1.3, color: INK }}>
                    This week we look at the people quietly rebuilding the tools everyone else depends on.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reports + Most Read */}
        <section className="flex flex-wrap mt-14" style={{ borderTop: `3px double ${INK}`, paddingTop: 44, gap: 44 }}>
          <div className="flex-1 min-w-0" style={{ flexBasis: 620 }}>
            <div className="flex items-baseline justify-between gap-5 pb-4" style={{ borderBottom: `1px solid ${INK}` }}>
              <h2 className="font-serif font-semibold m-0" style={{ fontSize: 30, color: INK }}>Reports</h2>
              <Link href="/search" className="text-[10.5px] uppercase shrink-0" style={{ letterSpacing: "0.2em", color: ACCENT }}>
                All stories →
              </Link>
            </div>

            {latest.map((article) => (
              <article key={article.id} className="flex flex-wrap py-7" style={{ borderBottom: `1px solid ${RULE}`, gap: 26 }}>
                <FeedLink row={article} className="shrink-0" >
                  <div className="relative aspect-[4/3] overflow-hidden" style={{ width: 220, maxWidth: "100%", background: PANEL }}>
                    <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="220px" />
                  </div>
                </FeedLink>
                <div className="flex-1 min-w-0" style={{ flexBasis: 280 }}>
                  <Kicker>{article.category?.categoryName}</Kicker>
                  <FeedLink row={article}>
                    <h3 className="font-serif font-semibold mt-2.5 mb-0" style={{ fontSize: 25, lineHeight: 1.2, color: INK }}>
                      {article.title}
                    </h3>
                  </FeedLink>
                  {article.content && (
                    <p className="text-[15px] leading-[1.6] mt-2.5" style={{ color: MUTED }}>
                      {excerpt(article.content, 150)}
                    </p>
                  )}
                  <div className="mt-3 text-[10.5px] uppercase" style={{ letterSpacing: "0.12em", color: MUTED }}>
                    {(article.source ?? byline)} · {formatDate(article.createdAt)}
                  </div>
                </div>
              </article>
            ))}

            <div className="pt-8">
              <Link href="/search" className="inline-block text-[10.5px] uppercase px-7 py-3" style={{ border: `1px solid ${INK}`, color: INK, letterSpacing: "0.2em" }}>
                More reports
              </Link>
            </div>
          </div>

          <aside className="flex-1 min-w-0" style={{ flexBasis: 290 }}>
            <div className="pb-4" style={{ borderBottom: `1px solid ${INK}` }}>
              <h2 className="font-serif font-semibold m-0" style={{ fontSize: 30, color: INK }}>Most Read</h2>
            </div>
            {mostRead.map((article, i) => (
              <div key={article.id} className="flex py-5" style={{ borderBottom: `1px solid ${RULE}`, gap: 18 }}>
                <div className="font-serif shrink-0" style={{ fontSize: 36, lineHeight: 0.9, color: RULE }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <LinkBody row={article} className="font-serif" style={{ fontSize: 19, lineHeight: 1.3, color: INK }}>
                  {article.title}
                </LinkBody>
              </div>
            ))}

            {adKeys?.["300x250"] && (
              <div className="mt-8 flex justify-center pt-6" style={{ borderTop: `1px solid ${RULE}` }}>
                <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} />
              </div>
            )}
          </aside>
        </section>

        {/* Desks */}
        <section className="pt-16 mt-14" style={{ borderTop: `3px double ${INK}` }}>
          <div className="flex items-baseline justify-between gap-5 pb-5">
            <h2 className="font-serif font-semibold m-0" style={{ fontSize: 32, color: INK }}>Desks</h2>
            <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.2em", color: MUTED }}>
              Updated hourly
            </div>
          </div>
          <div className="grid gap-x-11" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {categories.map((category) => {
              const items = rows.filter((a) => a.category?.categoryName === category).slice(0, 3);
              if (items.length === 0) return null;
              return (
                <div key={category} className="pt-5 pb-8" style={{ borderTop: `1px solid ${INK}` }}>
                  <h3 className="font-serif font-semibold m-0" style={{ fontSize: 21, color: INK }}>{category}</h3>
                  <div className="flex flex-col mt-4" style={{ gap: 14 }}>
                    {items.map((a, i) => (
                      <LinkBody
                        key={a.id}
                        row={a}
                        className="text-[15px] leading-[1.45] transition-colors hover:opacity-70"
                        style={{ color: INK, borderTop: i > 0 ? `1px solid ${RULE}` : "none", paddingTop: i > 0 ? 14 : 0, display: "block" }}
                      >
                        {a.title}
                      </LinkBody>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Essays */}
        {essays.length > 0 && (
          <section className="mt-14" style={{ background: PANEL, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
            <div className="max-w-[1340px] mx-auto px-4 sm:px-7 py-16">
              <div className="flex items-baseline justify-between gap-5 pb-5" style={{ borderBottom: `1px solid ${INK}` }}>
                <h2 className="font-serif font-semibold m-0" style={{ fontSize: 32, color: INK }}>Essays</h2>
                <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: ACCENT }}>
                  Opinion
                </div>
              </div>
              <div className="grid gap-9 pt-9" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
                {essays.map((op) => (
                  <article key={op.id}>
                    <div className="relative w-full overflow-hidden mb-4" style={{ aspectRatio: "16/10", background: "rgba(0,0,0,0.06)" }}>
                      <StoryImage src={op.imageUrl} alt={op.title} fill className="object-cover" sizes="400px" />
                    </div>
                    <h3 className="font-serif font-semibold m-0" style={{ fontSize: 24, lineHeight: 1.24, color: INK }}>
                      {op.title}
                    </h3>
                    <p className="text-[15px] leading-[1.6] mt-3" style={{ color: MUTED }}>
                      {excerpt(op.content, 150)}
                    </p>
                    <div className="mt-4 pt-3.5" style={{ borderTop: `1px solid ${RULE}` }}>
                      <div className="text-[13px] font-semibold uppercase" style={{ letterSpacing: "0.06em", color: INK }}>
                        {op.source ?? byline}
                      </div>
                      <div className="text-[12.5px] mt-1" style={{ color: MUTED }}>{op.category?.categoryName}</div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* The Long Read */}
        <section style={{ background: INK, color: "rgba(255,255,255,0.92)" }} className="-mx-4 sm:-mx-7">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-7 py-16">
            <div className="flex items-center gap-4 pb-8">
              <span className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.28em", color: ACCENT }}>
                The Long Read
              </span>
              <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
              <span className="text-[10.5px] uppercase" style={{ letterSpacing: "0.18em", color: "rgba(255,255,255,0.5)" }}>
                Feature
              </span>
            </div>
            <div className="flex flex-wrap gap-11">
              <div className="flex-1 min-w-0" style={{ flexBasis: 540 }}>
                <FeedLink row={feature}>
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/2", background: "rgba(255,255,255,0.05)" }}>
                    <StoryImage src={feature.imageUrl} alt={feature.title} fill className="object-cover" sizes="600px" />
                  </div>
                </FeedLink>
                <h2 className="font-serif font-semibold mt-7" style={{ fontSize: "clamp(26px,3.2vw,40px)", lineHeight: 1.12, color: "#fff" }}>
                  {feature.title}
                </h2>
                {feature.content && (
                  <p className="text-[18px] leading-[1.6] max-w-[62ch] mt-4" style={{ color: "rgba(255,255,255,0.72)" }}>
                    {excerpt(feature.content, 240)}
                  </p>
                )}
                <div
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-5 pt-4 text-[11px] uppercase"
                  style={{ letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <span style={{ color: "#fff", fontWeight: 600 }}>By {feature.source ?? byline}</span>
                  <span className="w-px h-2.5" style={{ background: "rgba(255,255,255,0.25)" }} />
                  <span>{formatDate(feature.createdAt)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col" style={{ flexBasis: 300 }}>
                <div className="text-[10px] font-bold uppercase pb-3.5" style={{ letterSpacing: "0.26em", color: ACCENT, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                  Also in the feature well
                </div>
                {featureSeries.map((a) => (
                  <LinkBody key={a.id} row={a} className="py-5 block" style={{ color: "rgba(255,255,255,0.92)", borderBottom: "1px solid rgba(255,255,255,0.15)", display: "block" }}>
                    <span className="font-serif block" style={{ fontSize: 21, lineHeight: 1.26 }}>{a.title}</span>
                    <span className="text-[11px] uppercase mt-2 block" style={{ letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>
                      {readingMinutes(a.content)} min read
                    </span>
                  </LinkBody>
                ))}
                <Link href="/search" className="mt-6 inline-block text-center px-6 py-3 text-[10.5px] uppercase" style={{ border: `1px solid ${ACCENT}`, color: ACCENT, letterSpacing: "0.2em" }}>
                  All features
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section style={{ background: PAPER }}>
        <div className="max-w-[900px] mx-auto px-4 sm:px-7 py-20 text-center">
          <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.28em", color: ACCENT }}>Newsletter</div>
          <h2 className="font-serif font-semibold mt-4" style={{ fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.12, color: INK }}>
            The weekly issue, by email
          </h2>
          <p className="text-[18px] leading-[1.55] max-w-[56ch] mx-auto mt-4" style={{ color: MUTED }}>
            One considered edit of the week in technology — features, essays, and the reporting worth your time.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap gap-3 justify-center mt-8 max-w-[560px] mx-auto">
            <input
              placeholder="your@email.com"
              className="flex-1 min-w-[260px] bg-transparent outline-none text-[15px]"
              style={{ border: `1px solid ${RULE}`, padding: "15px 16px", color: INK }}
            />
            <button
              type="submit"
              className="shrink-0 text-[10.5px] uppercase"
              style={{ background: INK, color: PAPER, border: "none", padding: "15px 30px", letterSpacing: "0.18em" }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
