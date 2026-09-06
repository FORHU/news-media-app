"use client"; // LegalHyper Landing — broadsheet homepage per "The Legal Review" design

import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { TENANT_CATEGORIES } from "@/config/categories";
import { LEGALHYPER_MOCK_OPINIONS } from "./mockArticles";
import type { MockArticle } from "./mockArticles";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string | null;
  positions: string[];
}

interface Props {
  tenantId: string | null;
  articles: MockArticle[];
  banners: {
    top: Banner[];
    sidebar: Banner[];
    footer: Banner[];
  };
}

function articleHref(article: MockArticle) {
  return `/article/${article.slug || article.id}`;
}

function readingMinutes(content?: string | null) {
  const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const INK = "#0E1A2F";
const INK_DARK = "#0B1424";
const GOLD = "#8A6A22";
const BRASS = "#B08D3F";
const MAROON = "#7A1F2B";
const PARCHMENT = "#F4F0E6";
const RULE = "#DCD5C2";

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.26em", color: GOLD }}>
      {children}
    </span>
  );
}

function ImagePlaceholder({ article, aspect }: { article: MockArticle; aspect: string }) {
  return (
    <div className="relative w-full overflow-hidden bg-[#E3DECF]" style={{ aspectRatio: aspect }}>
      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 1200px" />
    </div>
  );
}

function getByCategory(articles: MockArticle[], name: string, n = 3) {
  return articles
    .filter((a) => a.category?.categoryName === name)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, n);
}

export function LegalHyperLanding({ articles, banners }: Props) {
  if (articles.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 font-chivo" style={{ background: PARCHMENT }}>
        <div className="text-center">
          <p className="text-xl font-semibold mb-2" style={{ color: INK }}>No stories published yet.</p>
          <p className="text-sm mt-1" style={{ color: "#8A8A7C" }}>Check back soon for the latest coverage from LegalHyper.</p>
        </div>
      </div>
    );
  }

  const tenantConfig = ADSTERRA_CONFIG.legalhyper;
  const adKeys = tenantConfig.banners;

  const sorted = [...articles].sort((a, b) => {
    if ((b.trendingScore ?? 0) !== (a.trendingScore ?? 0)) return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const lead = sorted[0];
  const alsoThisMorning = sorted.slice(1, 3);
  const usedIds = new Set([lead.id, ...alsoThisMorning.map((a) => a.id)]);

  const latestPool = sorted.filter((a) => !usedIds.has(a.id));
  const latest = latestPool.slice(0, 5);
  latest.forEach((a) => usedIds.add(a.id));

  const mostRead = [...sorted].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0)).slice(0, 5);

  const categories = TENANT_CATEGORIES["legalhyper.com"] ?? [];
  const investigation = sorted.find((a) => a.category?.categoryName === "Legal Geek Coverage") ?? sorted[0];
  const investigationSeries = sorted.filter((a) => a.id !== investigation.id).slice(0, 3);

  return (
    <div className="font-chivo" style={{ background: PARCHMENT, color: "#1A1A16", minHeight: "100vh" }}>
      {banners.top.length === 0 && adKeys["728x90"] && (
        <div className="max-w-[1340px] mx-auto px-4 sm:px-7 pt-4 flex justify-center">
          <div className="hidden sm:block">
            <AdsterraBanner bannerKey={adKeys["728x90"]} width={728} height={90} />
          </div>
          {adKeys["320x50"] && (
            <div className="block sm:hidden">
              <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} />
            </div>
          )}
        </div>
      )}

      <main className="max-w-[1340px] mx-auto px-4 sm:px-7">
        {/* Hero — full-width lead image, then a two-column split */}
        <section className="pt-11">
          <Link href={articleHref(lead)} className="block">
            <ImagePlaceholder article={lead} aspect="21/9" />
          </Link>

          <div className="flex flex-wrap gap-10 sm:gap-13 pt-8" style={{ gap: 40 }}>
            <div className="flex-1 min-w-0" style={{ flexBasis: 600 }}>
              <div className="flex items-center gap-3.5">
                <Kicker>{lead.category?.categoryName}</Kicker>
                <span className="flex-1 h-px" style={{ background: BRASS }} />
              </div>
              <Link href={articleHref(lead)}>
                <h1
                  className="font-bodoni font-medium uppercase m-0 mt-5"
                  style={{ fontSize: "clamp(30px,4.4vw,54px)", lineHeight: 1.06, letterSpacing: "-0.005em", color: INK }}
                >
                  {lead.title}
                </h1>
              </Link>
              {lead.content && (
                <p className="font-garamond text-[19px] leading-[1.58] max-w-[58ch] mt-5" style={{ color: "#3B3B33" }}>
                  {lead.content}
                </p>
              )}
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-5 pt-4 text-[11px] uppercase"
                style={{ letterSpacing: "0.12em", color: "#7A7466", borderTop: `1px solid ${RULE}` }}
              >
                <span style={{ color: "#1A1A16", fontWeight: 600 }}>By {lead.author}</span>
                <span className="w-px h-2.5" style={{ background: "#CBC4B1" }} />
                <span>{formatDate(lead.createdAt)}</span>
                <span className="w-px h-2.5" style={{ background: "#CBC4B1" }} />
                <span>{readingMinutes(lead.content)} min read</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-6" style={{ flexBasis: 290 }}>
              <div className="pt-4.5" style={{ borderTop: `1px solid ${INK}`, paddingTop: 18 }}>
                <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.26em", color: GOLD }}>
                  Also this morning
                </div>
              </div>
              {alsoThisMorning.map((article, i) => (
                <div key={article.id} style={i > 0 ? { borderTop: `1px solid ${RULE}`, paddingTop: 22 } : undefined}>
                  <Link href={articleHref(article)}>
                    <h2 className="font-garamond font-semibold m-0" style={{ fontSize: 22, lineHeight: 1.24, color: INK }}>
                      {article.title}
                    </h2>
                  </Link>
                  <div className="mt-2.5 text-[10.5px] uppercase" style={{ letterSpacing: "0.12em", color: "#7A7466" }}>
                    {article.author} · {readingMinutes(article.content)} min
                  </div>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 22 }}>
                <div style={{ borderLeft: `2px solid ${MAROON}`, paddingLeft: 14 }}>
                  <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: MAROON }}>
                    Legal Alert
                  </div>
                  <div className="font-garamond mt-2" style={{ fontSize: 18, lineHeight: 1.3, color: "#1A1A16" }}>
                    Legal Geek London registration closes for early-bird passes at the end of this week.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Legal News + Most Read */}
        <section
          className="flex flex-wrap gap-10 sm:gap-13 mt-14"
          style={{ borderTop: `3px double ${INK}`, paddingTop: 44, gap: 44 }}
        >
          <div className="flex-1 min-w-0" style={{ flexBasis: 620 }}>
            <div className="flex items-baseline justify-between gap-5 pb-4" style={{ borderBottom: `1px solid ${INK}` }}>
              <h2 className="font-garamond font-semibold m-0" style={{ fontSize: 30, color: INK, letterSpacing: "0.02em" }}>
                Legal AI News
              </h2>
              <Link href="/search" className="text-[10.5px] uppercase shrink-0" style={{ letterSpacing: "0.2em", color: GOLD }}>
                All coverage →
              </Link>
            </div>

            {latest.map((article) => (
              <article key={article.id} className="flex flex-wrap gap-6.5 py-7" style={{ borderBottom: `1px solid ${RULE}`, gap: 26 }}>
                <Link href={articleHref(article)} className="shrink-0" style={{ flexBasis: 220, maxWidth: "100%" }}>
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#E3DECF]">
                    <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="220px" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0" style={{ flexBasis: 280 }}>
                  <Kicker>{article.category?.categoryName}</Kicker>
                  <Link href={articleHref(article)}>
                    <h3 className="font-garamond font-semibold mt-2.5 mb-0" style={{ fontSize: 25, lineHeight: 1.2, color: INK }}>
                      {article.title}
                    </h3>
                  </Link>
                  {article.content && (
                    <p className="text-[15px] leading-[1.6] mt-2.5" style={{ color: "#4E4E45" }}>
                      {article.content}
                    </p>
                  )}
                  <div className="mt-3 text-[10.5px] uppercase" style={{ letterSpacing: "0.12em", color: "#7A7466" }}>
                    {article.author} · {formatDate(article.createdAt)}
                  </div>
                </div>
              </article>
            ))}

            <div className="pt-8">
              <Link href="/search" className="inline-block text-[10.5px] uppercase px-7 py-3" style={{ border: `1px solid ${INK}`, color: INK, letterSpacing: "0.2em" }}>
                More legal news
              </Link>
            </div>
          </div>

          <aside className="flex-1 min-w-0" style={{ flexBasis: 290 }}>
            <div className="pb-4" style={{ borderBottom: `1px solid ${INK}` }}>
              <h2 className="font-garamond font-semibold m-0" style={{ fontSize: 30, color: INK, letterSpacing: "0.02em" }}>Most Read</h2>
            </div>
            {mostRead.map((article, i) => (
              <div key={article.id} className="flex gap-4.5 py-5" style={{ borderBottom: `1px solid ${RULE}`, gap: 18 }}>
                <div className="font-bodoni shrink-0" style={{ fontSize: 36, lineHeight: 0.9, color: "#C3BCA7" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <Link href={articleHref(article)} className="font-garamond" style={{ fontSize: 19, lineHeight: 1.3, color: INK }}>
                  {article.title}
                </Link>
              </div>
            ))}

            <div className="mt-9 p-6" style={{ background: "#EFEADC", border: `1px solid ${RULE}`, borderTop: `2px solid ${BRASS}` }}>
              <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: GOLD }}>
                On the Docket This Week
              </div>
              <div className="flex flex-col gap-3.5 mt-4">
                {[
                  { label: "Legal AI keynote", when: "Day 1 · Main Stage" },
                  { label: "Regulation & Policy panel", when: "Day 1 · Track B" },
                  { label: "Courts & Litigation briefing", when: "Day 2 · Track A" },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3" style={{ borderTop: "1px solid #DFD9C8", paddingTop: 13 }}>
                    <div className="text-[11px] shrink-0" style={{ color: "#7A7466", flexBasis: 50, paddingTop: 3, letterSpacing: "0.06em" }}>
                      {item.when.split(" · ")[0]}
                    </div>
                    <div className="font-garamond text-[16px] leading-[1.4]" style={{ color: "#1A1A16" }}>
                      {item.label} — <em>{item.when.split(" · ")[1]}</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {adKeys["300x250"] && (
              <div className="mt-8 flex justify-center pt-6" style={{ borderTop: `1px solid ${RULE}` }}>
                <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} />
              </div>
            )}
          </aside>
        </section>

        {/* Featured desks */}
        <section className="pt-16 mt-14" style={{ borderTop: `3px double ${INK}` }}>
          <div className="flex items-baseline justify-between gap-5 pb-5">
            <h2 className="font-garamond font-semibold m-0" style={{ fontSize: 32, color: INK, letterSpacing: "0.02em" }}>Featured Desks</h2>
            <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.2em", color: "#7A7466" }}>
              Six desks · updated hourly
            </div>
          </div>
          <div className="grid gap-x-11 gap-y-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {categories.map((category) => {
              const items = getByCategory(articles, category, 3);
              if (items.length === 0) return null;
              return (
                <div key={category} className="pt-5 pb-8" style={{ borderTop: `1px solid ${INK}` }}>
                  <h3 className="font-garamond font-semibold m-0" style={{ fontSize: 21, color: INK }}>{category}</h3>
                  <div className="flex flex-col gap-3.5 mt-4.5" style={{ marginTop: 18 }}>
                    {items.map((a, i) => (
                      <Link
                        key={a.id}
                        href={articleHref(a)}
                        className="text-[15px] leading-[1.45] transition-colors hover:text-[#8A6A22]"
                        style={{ color: "#1A1A16", borderTop: i > 0 ? "1px solid #E6E0D0" : "none", paddingTop: i > 0 ? 14 : 0 }}
                      >
                        {a.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Opinion & Analysis */}
        <section className="mt-14" style={{ background: "#EFEADC", borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
          <div className="max-w-[1340px] mx-auto px-4 sm:px-7 py-16">
            <div className="flex items-baseline justify-between gap-5 pb-5" style={{ borderBottom: `1px solid ${INK}` }}>
              <h2 className="font-garamond font-semibold m-0" style={{ fontSize: 32, color: INK, letterSpacing: "0.02em" }}>Opinion &amp; Analysis</h2>
              <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: GOLD }}>
                Expert Analysis
              </div>
            </div>
            <div className="grid gap-9 pt-9" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
              {LEGALHYPER_MOCK_OPINIONS.map((op) => (
                <article key={op.id}>
                  <div
                    className="w-24 h-24 rounded-full mb-4.5 flex items-center justify-center"
                    style={{ background: "repeating-linear-gradient(135deg,#D6D0C1 0 8px,#DFDACB 8px 16px)", marginBottom: 18 }}
                  />
                  <h3 className="font-garamond font-semibold m-0" style={{ fontSize: 24, lineHeight: 1.24, color: INK }}>
                    {op.title}
                  </h3>
                  <p className="text-[15px] leading-[1.6] mt-3.5" style={{ color: "#4E4E45" }}>
                    {op.dek}
                  </p>
                  <div className="mt-4 pt-3.5" style={{ borderTop: `1px solid ${RULE}` }}>
                    <div className="text-[13px] font-semibold uppercase" style={{ letterSpacing: "0.06em", color: "#1A1A16" }}>
                      {op.author}
                    </div>
                    <div className="text-[12.5px] mt-1" style={{ color: "#7A7466" }}>{op.credential}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Investigation */}
        <section style={{ background: INK_DARK, color: "#EDE9DE" }} className="-mx-4 sm:-mx-7">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-7 py-16">
            <div className="flex items-center gap-4 pb-8">
              <span className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.28em", color: BRASS }}>
                Investigation
              </span>
              <span className="flex-1 h-px" style={{ background: "#26314A" }} />
              <span className="text-[10.5px] uppercase" style={{ letterSpacing: "0.18em", color: "#8E97A8" }}>
                Ongoing series
              </span>
            </div>
            <div className="flex flex-wrap gap-11">
              <div className="flex-1 min-w-0" style={{ flexBasis: 540 }}>
                <Link href={articleHref(investigation)}>
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/2", background: "repeating-linear-gradient(135deg,#16223A 0 10px,#1C2A46 10px 20px)" }}>
                    <StoryImage src={investigation.imageUrl} alt={investigation.title} fill className="object-cover" sizes="600px" />
                  </div>
                </Link>
                <h2 className="font-bodoni font-medium uppercase mt-7" style={{ fontSize: "clamp(26px,3.2vw,40px)", lineHeight: 1.12, color: "#F4F0E6" }}>
                  {investigation.title}
                </h2>
                {investigation.content && (
                  <p className="font-garamond text-[18px] leading-[1.6] max-w-[62ch] mt-4.5" style={{ color: "#C3C9D6" }}>
                    {investigation.content}
                  </p>
                )}
                <div
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-5 pt-4 text-[11px] uppercase"
                  style={{ letterSpacing: "0.12em", color: "#8E97A8", borderTop: "1px solid #26314A" }}
                >
                  <span style={{ color: "#EDE9DE", fontWeight: 600 }}>By {investigation.author}</span>
                  <span className="w-px h-2.5" style={{ background: "#3A465F" }} />
                  <span>{formatDate(investigation.createdAt)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col" style={{ flexBasis: 300 }}>
                <div className="text-[10px] font-bold uppercase pb-3.5" style={{ letterSpacing: "0.26em", color: BRASS, borderBottom: "1px solid #26314A" }}>
                  More from the series
                </div>
                {investigationSeries.map((a) => (
                  <Link key={a.id} href={articleHref(a)} className="py-5" style={{ color: "#EDE9DE", borderBottom: "1px solid #26314A" }}>
                    <div className="font-garamond" style={{ fontSize: 21, lineHeight: 1.26 }}>{a.title}</div>
                    <div className="text-[11px] uppercase mt-2" style={{ letterSpacing: "0.1em", color: "#8E97A8" }}>
                      {readingMinutes(a.content)} min read
                    </div>
                  </Link>
                ))}
                <Link href="/search" className="mt-6 inline-block text-center px-6 py-3 text-[10.5px] uppercase" style={{ border: `1px solid ${BRASS}`, color: BRASS, letterSpacing: "0.2em" }}>
                  All investigations
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Newsletter */}
      <section style={{ background: PARCHMENT }}>
        <div className="max-w-[900px] mx-auto px-4 sm:px-7 py-20 text-center">
          <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.28em", color: GOLD }}>Newsletter</div>
          <h2 className="font-bodoni font-medium uppercase mt-4.5" style={{ fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.12, color: INK }}>
            Stay Ahead of Legal AI
          </h2>
          <p className="font-garamond text-[18px] leading-[1.55] max-w-[56ch] mx-auto mt-4.5" style={{ color: "#3B3B33" }}>
            Get the day&apos;s most important legal AI news, product launches, and policy developments delivered to your inbox.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap gap-3 justify-center mt-8 max-w-[560px] mx-auto">
            <input
              placeholder="your@email.com"
              className="flex-1 min-w-[260px] bg-transparent outline-none text-[15px]"
              style={{ border: "1px solid #CBC4B1", padding: "15px 16px", color: "#1A1A16" }}
            />
            <button
              type="submit"
              className="shrink-0 text-[10.5px] uppercase"
              style={{ background: INK, color: PARCHMENT, border: "none", padding: "15px 30px", letterSpacing: "0.18em" }}
            >
              Subscribe
            </button>
          </form>
          <p className="text-[12px] leading-[1.6] mx-auto mt-5 max-w-[46ch]" style={{ color: "#7A7466" }}>
            We use your email only to send the LegalHyper briefing. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  );
}
