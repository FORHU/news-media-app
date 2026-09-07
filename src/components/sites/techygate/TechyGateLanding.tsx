"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { StoryImage } from "@/components/StoryImage";
import { getCoreCategories, normalizeCategoryKey } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";
import { getTechNewsTheme, techNewsVars } from "../technews-shared/theme";
import { toFeedRows, excerpt, type FeedRow } from "../technews-shared/feed";
import { FeedLink } from "../technews-shared/FeedLink";

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => <div className="h-[110px] animate-pulse bg-[var(--tn-accent-soft)]" />,
});

interface Props {
  domain: string;
  tenantId: string | null;
  articles: Parameters<typeof toFeedRows>[0];
  banners: { top: unknown[]; sidebar: unknown[]; footer: unknown[] };
  mediastackArticles?: MediaStackArticle[];
}

function fmtDate(iso: string, long = false) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: long ? "long" : "short",
    day: "numeric",
    year: "numeric",
  });
}

function GateHead({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-stretch gap-0 mb-6">
      <span className="w-[6px] bg-[var(--tn-accent)] shrink-0" aria-hidden />
      <h2 className="bg-[var(--tn-ink)] text-[var(--tn-bg)] font-serif text-lg font-bold uppercase tracking-[0.08em] px-4 py-2 leading-none flex items-center">
        {children}
      </h2>
      <span className="flex-1 border-b-2 border-[var(--tn-ink)] self-end" aria-hidden />
      {href && (
        <Link href={href} className="self-center ml-3 text-[11px] font-bold uppercase tracking-widest text-[var(--tn-accent)] shrink-0">
          All →
        </Link>
      )}
    </div>
  );
}

export default function TechyGateLanding({ domain, articles, banners, mediastackArticles = [] }: Props) {
  const theme = getTechNewsTheme(domain);
  const categories = getCoreCategories(domain);
  const canonical = new Map(categories.map((c) => [normalizeCategoryKey(c), c.trim()]));

  const rows = toFeedRows(articles, mediastackArticles);
  const dbRows = rows.filter((r) => !r.external);
  const extRows = rows.filter((r) => r.external && r.imageUrl);
  const feedRows = dbRows.length > 0 ? rows : extRows;

  const lead = feedRows[0];
  const latest = feedRows.slice(1, 13);
  const latestHead = latest.slice(0, latest.length - 1);
  const latestLast = latest[latest.length - 1];

  const grouped = new Map<string, FeedRow[]>();
  for (const a of feedRows) {
    if (a.id === lead?.id) continue;
    const raw = a.category?.categoryName || "Tech";
    const cat = canonical.get(normalizeCategoryKey(raw)) ?? raw;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(a);
  }
  const categoryBlocks = Array.from(grouped.entries())
    .map(([name, items]) => ({ name, items }))
    .filter((g) => g.items.length >= 2)
    .slice(0, 4);

  if (!theme) return null;
  const ad = ADSTERRA_CONFIG[theme.key]?.banners;

  if (rows.length === 0) {
    return (
      <div style={techNewsVars(theme)} className="min-h-[60vh] bg-[var(--tn-bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-serif font-bold uppercase tracking-tight text-[var(--tn-ink)] mb-2">The gate is open.</p>
          <p className="text-sm text-[var(--tn-muted)]">Stories load here shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={techNewsVars(theme)} className="bg-[var(--tn-bg)] text-[var(--tn-ink)] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-14">
        {lead && (
          <FeedLink
            row={lead}
            className="group border-4 border-[var(--tn-ink)]"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              alignItems: "center",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "relative",
                width: "100%",
                height: "clamp(200px, 34vw, 400px)",
                overflow: "hidden",
                backgroundColor: "var(--tn-accent-soft)",
                backgroundImage: lead.imageUrl ? `url("${lead.imageUrl}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                <span className="inline-block self-start bg-[var(--tn-accent)] text-[var(--tn-accent-ink)] text-[11px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 mb-3">
                  {lead.category?.categoryName ?? "Top"}
                </span>
                <h1 className="font-serif text-4xl lg:text-5xl font-bold uppercase text-[var(--tn-ink)] leading-[1.02] group-hover:text-[var(--tn-accent)] transition-colors mb-4">
                  {lead.title}
                </h1>
                <p className="text-[15px] text-[var(--tn-muted)] leading-relaxed line-clamp-4">{excerpt(lead.content, 280)}</p>
                <span className="text-[12px] text-[var(--tn-muted)] font-bold uppercase tracking-widest mt-6">{fmtDate(lead.createdAt, true)}</span>
            </div>
          </FeedLink>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <GateHead>Fast Lane</GateHead>
            <div className="flex flex-col divide-y-2 divide-[var(--tn-rule)]">
              {latestHead.map((a, i) => {
                const featured = i === 0 || i % 3 === 0;
                if (featured) {
                  return (
                    <FeedLink key={a.id} row={a} className="group flex flex-col sm:flex-row gap-5 items-start py-6 first:pt-0">
                      <div className="relative w-full sm:w-[300px] h-[200px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden">
                        <StoryImage src={a.imageUrl} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="300px" />
                      </div>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-accent)]">{a.category?.categoryName ?? "Tech"}</span>
                        <h3 className="font-serif text-[22px] font-bold uppercase text-[var(--tn-ink)] leading-[1.05] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">{a.title}</h3>
                        <p className="text-[13px] text-[var(--tn-muted)] leading-relaxed line-clamp-3">{excerpt(a.content, 160)}</p>
                        <span className="text-[11px] text-[var(--tn-muted)] font-bold uppercase mt-auto">{fmtDate(a.createdAt)}</span>
                      </div>
                    </FeedLink>
                  );
                }
                return null;
              })}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6">
                {latestHead.filter((_, i) => !(i === 0 || i % 3 === 0)).map((a) => (
                  <FeedLink key={a.id} row={a} className="group flex flex-col gap-2">
                    <div className="relative w-full aspect-[4/3] bg-[var(--tn-accent-soft)] overflow-hidden">
                      <StoryImage src={a.imageUrl} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 33vw" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-accent)]">{a.category?.categoryName ?? "Tech"}</span>
                    <h4 className="font-serif text-[15px] font-bold uppercase text-[var(--tn-ink)] leading-[1.08] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">{a.title}</h4>
                  </FeedLink>
                ))}
              </div>
              {latestLast && (
                <FeedLink row={latestLast} className="group flex flex-col sm:flex-row items-stretch py-6">
                  <div className="relative w-full sm:w-1/2 min-h-[180px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden">
                    <StoryImage src={latestLast.imageUrl} alt={latestLast.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="50vw" />
                  </div>
                  <div className="flex flex-col justify-center gap-2 flex-1 min-w-0 pt-4 sm:pt-0 sm:pl-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-accent)]">{latestLast.category?.categoryName ?? "Tech"}</span>
                    <h3 className="font-serif text-[22px] font-bold uppercase text-[var(--tn-ink)] leading-[1.05] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">{latestLast.title}</h3>
                    <p className="text-[13px] text-[var(--tn-muted)] leading-relaxed line-clamp-3">{excerpt(latestLast.content, 200)}</p>
                  </div>
                </FeedLink>
              )}
            </div>
          </div>

          {extRows.length > 0 && (
            <aside className="lg:col-span-4">
              <GateHead>The Wire</GateHead>
              <div className="flex flex-col divide-y-2 divide-[var(--tn-rule)] border-2 border-[var(--tn-ink)]">
                {extRows.slice(0, 10).map((item) => (
                  <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="group flex gap-3 items-center p-4 hover:bg-[var(--tn-accent-soft)]/60 transition-colors">
                    <div className="relative w-[90px] h-[76px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden">
                      <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="90px" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--tn-accent)] truncate">{item.source}</span>
                        <span className="text-[9px] text-[var(--tn-muted)] shrink-0">{fmtDate(item.createdAt)}</span>
                      </div>
                      <h4 className="font-serif text-[13px] font-bold uppercase text-[var(--tn-ink)] leading-[1.1] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">{item.title}</h4>
                    </div>
                  </a>
                ))}
              </div>
            </aside>
          )}
        </div>

        {ad && (
          <div className="flex justify-center py-4 border-y-2 border-[var(--tn-ink)] bg-[var(--tn-accent-soft)]/40">
            <div className="hidden sm:block">
              <AdsterraBanner bannerKey={ad["728x90"] || ad["468x60"]} width={ad["728x90"] ? 728 : 468} height={ad["728x90"] ? 90 : 60} className="!my-0" />
            </div>
            <div className="block sm:hidden">
              <AdsterraBanner bannerKey={ad["320x50"]} width={320} height={50} className="!my-0" />
            </div>
          </div>
        )}

        {extRows.length > 10 && (
          <section>
            <GateHead>Trending Now</GateHead>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {extRows.slice(10, 14).map((item) => (
                <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="group border-2 border-[var(--tn-ink)]">
                  <div className="relative aspect-[4/3] bg-[var(--tn-accent-soft)] overflow-hidden">
                    <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="300px" />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tn-accent)] block mb-1">{item.source}</span>
                    <h3 className="font-serif text-[15px] font-bold uppercase text-[var(--tn-ink)] leading-[1.08] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">{item.title}</h3>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {extRows.length > 14 && (
          <section>
            <GateHead>In the Headlines</GateHead>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extRows.slice(14, 20).map((item) => (
                <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="group flex gap-4 items-start border-2 border-[var(--tn-ink)] p-4">
                  <div className="relative w-[90px] h-[70px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden">
                    <StoryImage src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="90px" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tn-accent)] block mb-1">{item.source}</span>
                    <h4 className="font-serif text-[14px] font-bold uppercase text-[var(--tn-ink)] leading-[1.1] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">{item.title}</h4>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {categoryBlocks.map((group) => {
          const gLead = group.items[0];
          const gRest = group.items.slice(1, 4);
          return (
            <section key={group.name}>
              <GateHead href={`/search?category=${encodeURIComponent(group.name)}`}>{group.name}</GateHead>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <FeedLink row={gLead} className="lg:col-span-5 group block border-2 border-[var(--tn-ink)]">
                  <div className="relative aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden">
                    <StoryImage src={gLead.imageUrl} alt={gLead.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 1024px) 100vw, 42vw" />
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tn-accent)] block mb-2">{gLead.category?.categoryName ?? group.name}</span>
                    <h3 className="font-serif text-xl font-bold uppercase text-[var(--tn-ink)] leading-[1.08] group-hover:text-[var(--tn-accent)] transition-colors mb-3">{gLead.title}</h3>
                    <p className="text-sm text-[var(--tn-muted)] leading-relaxed line-clamp-3">{excerpt(gLead.content, 160)}</p>
                  </div>
                </FeedLink>
                {gRest.length > 0 && (
                  <div className="lg:col-span-7 flex flex-col divide-y-2 divide-[var(--tn-rule)] border-2 border-[var(--tn-ink)]">
                    {gRest.map((article) => (
                      <FeedLink key={article.id} row={article} className="group flex gap-4 items-start p-4 hover:bg-[var(--tn-accent-soft)]/60 transition-colors">
                        <div className="relative w-[110px] h-[78px] shrink-0 bg-[var(--tn-accent-soft)] overflow-hidden">
                          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="110px" />
                        </div>
                        <div className="min-w-0 flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tn-accent)]">{article.category?.categoryName ?? group.name}</span>
                          <h4 className="font-serif text-[15px] font-bold uppercase text-[var(--tn-ink)] leading-[1.1] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">{article.title}</h4>
                        </div>
                      </FeedLink>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}

        <div className="mt-12 border-t-2 border-[var(--tn-ink)] pt-8">
          <AdsterraNativeBanner domain={domain} />
        </div>
      </main>
    </div>
  );
}
