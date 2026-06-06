"use client";

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { StoryImage } from "@/components/StoryImage";
import type { RssArticle } from "@/lib/rss";
import type { MediaStackArticle } from "@/lib/mediastack";

interface ArticleRow {
  id: string;
  slug?: string | null;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  trendingScore?: number | null;
  isHeadline?: boolean | null;
  status?: string | null;
  category?: { categoryName?: string | null } | null;
}

interface Props {
  tenantId: string | null;
  articles: ArticleRow[];
  banners: { top: unknown[]; sidebar: unknown[]; footer: unknown[] };
  rssArticles?: RssArticle[];
  mediastackArticles?: MediaStackArticle[];
}

interface DisplayItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
  href: string;
  external: boolean;
  date: Date;
  excerpt: string;
  source?: string;
}

function articleHref(a: { slug?: string | null; id: string }) {
  return `/article/${a.slug || a.id}`;
}

function strip(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

function fromInternal(a: ArticleRow): DisplayItem {
  return {
    id: a.id,
    title: a.title,
    category: a.category?.categoryName ?? "Technologie",
    imageUrl: a.imageUrl ?? null,
    href: articleHref(a),
    external: false,
    date: new Date(a.createdAt),
    excerpt: strip(a.content),
  };
}

function fromRss(a: RssArticle): DisplayItem {
  return {
    id: a.id,
    title: a.title,
    category: a.category || "Technologie",
    imageUrl: a.imageUrl,
    href: a.link,
    external: true,
    date: new Date(a.pubDate),
    excerpt: a.excerpt,
    source: a.source,
  };
}

const GRADIENTS = [
  "from-blue-700 to-blue-900",
  "from-red-600 to-red-800",
  "from-blue-500 to-indigo-700",
  "from-slate-600 to-slate-800",
  "from-blue-800 to-blue-950",
  "from-rose-600 to-red-700",
];

function gradientFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function ImageFallback({ seed, label }: { seed: string; label?: string }) {
  const g = gradientFor(seed);
  const initials = (label ?? seed)
    .split(/\s+/).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (
    <div className={`w-full h-full bg-gradient-to-br ${g} flex flex-col items-center justify-center gap-1 select-none`}>
      <span className="text-white/90 text-2xl font-black leading-none">{initials}</span>
      {label && <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest px-2 text-center line-clamp-1 max-w-full">{label.split(" ").slice(0, 2).join(" ")}</span>}
    </div>
  );
}

function cleanImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("googleusercontent.com") || url.includes("gstatic.com") || url.includes("news.google.com")) return null;
  return url;
}

function readTime(text: string | null | undefined): number {
  const words = (text ?? "").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default function LavagueTechLanding({ articles, banners, rssArticles = [], mediastackArticles = [] }: Props) {
  const config = ADSTERRA_CONFIG["lavaguetech"];
  const ms = rssArticles;

  const sorted = [...articles].sort((a, b) => {
    const ha = a.isHeadline ? 1 : 0, hb = b.isHeadline ? 1 : 0;
    if (hb !== ha) return hb - ha;
    if ((b.trendingScore ?? 0) !== (a.trendingScore ?? 0)) return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const hasInternal = sorted.length > 0;

  // Hero: admin headline → top admin article → first RSS
  const headlineAdmin = sorted.find((a) => a.isHeadline) ?? (hasInternal ? sorted[0] : null);
  const hero: DisplayItem | null = headlineAdmin
    ? fromInternal(headlineAdmin)
    : ms[0] ? fromRss(ms[0]) : null;
  const heroIsInternal = headlineAdmin !== null;

  // RSS feed pool (skip hero article if it's from RSS).
  // Filter to only articles with a real image so every card slot shows a photo.
  const rssFeedRaw = heroIsInternal ? ms : ms.slice(1);
  const rssFeed = rssFeedRaw.filter((a) => cleanImage(a.imageUrl) !== null);

  // Right sidebar — 4 recent RSS articles (all have images after filter)
  const sidebarItems = rssFeed.slice(0, 4);

  // "Tendances de la semaine" — 3 RSS cards
  const weeklyCards = rssFeed.slice(4, 7);

  // "Plus d'articles" grid — 4 RSS cards
  const moreGrid = rssFeed.slice(7, 11);

  // MediaStack pool — only articles with a real image
  const msWithImage = mediastackArticles.filter((a) => cleanImage(a.image) !== null);
  const msGrid     = msWithImage.slice(0, 8);
  const msMustRead = msWithImage.slice(8, 14);
  const msDark     = msWithImage.slice(14, 17);
  // Reserve the tail of the MS pool (after the three main sections) for filling gaps
  const msFallback = msWithImage.slice(17);

  // "Recommandé par nos éditeurs" — admin articles first; fill remaining slots
  // with MediaStack articles so the section always shows 4 cards.
  const adminRecommended: DisplayItem[] = hasInternal
    ? sorted
        .filter((a) => !headlineAdmin || a.id !== headlineAdmin.id)
        .slice(0, 4)
        .map(fromInternal)
    : [];
  const recommendedSlots = 4;
  const msFillerCount = Math.max(0, recommendedSlots - adminRecommended.length);
  const msFiller: DisplayItem[] = msFallback.slice(0, msFillerCount).map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category || "Technologie",
    imageUrl: a.image,
    href: a.url,
    external: true,
    date: new Date(a.publishedAt),
    excerpt: a.description ?? "",
    source: a.source,
  }));
  const recommendedItems: DisplayItem[] = [...adminRecommended, ...msFiller];

  return (
    <div className="bg-white min-h-screen">

      {/* Gutter skyscrapers — only shown on very wide screens */}
      <div className="fixed left-2 top-40 hidden 2xl:block z-40">
        <AdsterraBanner bannerKey={config.banners["160x600"]} width={160} height={600} />
      </div>
      <div className="fixed right-2 top-40 hidden 2xl:block z-40">
        <AdsterraBanner bannerKey={config.banners["160x600"]} width={160} height={600} />
      </div>

      {/* Top ad */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
      </div>

      {/* Top leaderboard */}
      <div className="w-full flex justify-center py-3 overflow-hidden">
        <div className="hidden sm:block">
          <AdsterraBanner bannerKey={config.banners["728x90"]} width={728} height={90} className="!my-0" />
        </div>
        <div className="block sm:hidden">
          <AdsterraBanner bannerKey={config.banners["320x50"]} width={320} height={50} className="!my-0" />
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Featured card (large, image overlay) */}
          <div className="lg:col-span-7">
            {hero && (() => {
              const img = cleanImage(hero.imageUrl);
              const body = (
                <>
                  {/* Background image */}
                  {img ? (
                    hero.external ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={hero.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <StoryImage src={img} alt={hero.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="700px" />
                    )
                  ) : (
                    <ImageFallback seed={hero.category} label={hero.category} />
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
                    <div>
                      <span className="inline-block bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5">
                        Article vedette
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                          {hero.source ?? hero.category}
                        </span>
                        <span className="text-white/30">·</span>
                        <span className="text-[10px] text-white/60">
                          {hero.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <h2 className="text-[22px] sm:text-[28px] font-bold text-white leading-tight line-clamp-3 mb-2">
                        {hero.title}
                      </h2>
                      {hero.excerpt && (
                        <p className="text-[13px] text-white/70 line-clamp-2 leading-relaxed">{hero.excerpt}</p>
                      )}
                    </div>
                  </div>
                </>
              );
              return hero.external ? (
                <a href={hero.href} target="_blank" rel="noopener noreferrer" className="group relative block h-[420px] overflow-hidden bg-gray-900">
                  {body}
                </a>
              ) : (
                <Link href={hero.href} className="group relative block h-[420px] overflow-hidden bg-gray-900">
                  {body}
                </Link>
              );
            })()}
          </div>

          {/* Right sidebar — compact article list */}
          <div className="lg:col-span-5">
            <div className="divide-y divide-gray-100 h-full flex flex-col justify-between">
              {sidebarItems.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4 py-4 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 transition-colors"
                >
                  <div className="w-[88px] h-[66px] shrink-0 bg-gray-100 overflow-hidden flex-shrink-0">
                    {cleanImage(item.imageUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cleanImage(item.imageUrl)!} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ImageFallback seed={item.source} label={item.source} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-gray-400">
                        {new Date(item.pubDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="text-gray-200">·</span>
                      <span className="text-[9px] font-bold text-red-600">{readTime(item.excerpt)} min de lecture</span>
                    </div>
                    <h4 className="text-[13px] font-bold text-gray-800 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── RECOMMANDÉ PAR NOS ÉDITEURS (admin articles) ──────── */}
      {recommendedItems.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-blue-700 flex-shrink-0" />
            <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">Recommandé par nos éditeurs</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {recommendedItems.map((item) => {
              const img = cleanImage(item.imageUrl);
              const cardBody = (
                <>
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden mb-3">
                    {img ? (
                      item.external ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <StoryImage src={img} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="280px" />
                      )
                    ) : (
                      <ImageFallback seed={item.category} label={item.category} />
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 block mb-1">
                    {item.source ?? item.category}
                  </span>
                  <h3 className="text-[13px] font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </>
              );
              return item.external ? (
                <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="group">
                  {cardBody}
                </a>
              ) : (
                <Link key={item.id} href={item.href} className="group">
                  {cardBody}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mid-feed leaderboard */}
      <div className="w-full flex justify-center py-4 border-t border-b border-gray-100 overflow-hidden">
        <div className="hidden sm:block">
          <AdsterraBanner bannerKey={config.banners["728x90"]} width={728} height={90} className="!my-0" />
        </div>
        <div className="block sm:hidden">
          <AdsterraBanner bannerKey={config.banners["320x50"]} width={320} height={50} className="!my-0" />
        </div>
      </div>

      {/* ── TENDANCES DE LA SEMAINE ───────────────────────────── */}
      {weeklyCards.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100">
          <div className="text-center mb-10">
            <h2 className="text-[28px] font-bold text-gray-900">Tendances de la semaine</h2>
            <p className="text-gray-400 text-[13px] mt-2">
              Restez informés des dernières tendances technologiques
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {weeklyCards.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden mb-4">
                  {cleanImage(item.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cleanImage(item.imageUrl)!} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <ImageFallback seed={item.source} label={item.source} />
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] text-gray-400">
                    {new Date(item.pubDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-[9px] font-bold text-red-600">{readTime(item.excerpt)} min de lecture</span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2 mb-2">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">{item.excerpt}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── PLUS D'ARTICLES (4-col grid) ─────────────────────── */}
      {moreGrid.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-t border-gray-100 pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-red-600 flex-shrink-0" />
            <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">Plus d&apos;articles</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {moreGrid.map((item) => (
              <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="group">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden mb-3">
                  {cleanImage(item.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cleanImage(item.imageUrl)!} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <ImageFallback seed={item.source} label={item.source} />
                  )}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block mb-1">{item.source}</span>
                <h3 className="text-[12px] font-bold text-gray-800 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar ad */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar as never[]} />
      </div>

      {/* ── TENDANCES DU MOMENT (MediaStack, gray bg) ─────────── */}
      {msGrid.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-[24px] font-bold text-gray-900">Tendances du moment</h2>
              <p className="text-gray-400 text-[13px] mt-1">Les actualités tech à ne pas manquer</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {msGrid.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="group bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden mb-3">
                    {cleanImage(item.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cleanImage(item.image)!} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ImageFallback seed={item.source} label={item.source} />
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 block mb-1">{item.source}</span>
                  <h3 className="text-[12px] font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-gray-400 mt-1.5 block">
                    {new Date(item.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── À NE PAS MANQUER (MediaStack, 2-col list) ────────── */}
      {msMustRead.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-1 h-5 bg-blue-700 flex-shrink-0" />
            <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] whitespace-nowrap">À ne pas manquer</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {msMustRead.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="group flex gap-4">
                <div className="w-[120px] h-[80px] shrink-0 bg-gray-100 overflow-hidden">
                  {cleanImage(item.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cleanImage(item.image)!} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <ImageFallback seed={item.source} label={item.source} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-600">{item.source}</span>
                    <span className="text-gray-300 text-[9px]">·</span>
                    <span className="text-[9px] text-gray-400">
                      {new Date(item.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── MONDE & TECH (dark band) ──────────────────────────── */}
      {msDark.length > 0 && (
        <div className="bg-blue-950 py-12">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-5 bg-red-500 flex-shrink-0" />
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Monde &amp; Tech</h2>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {msDark.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="relative aspect-[16/9] bg-blue-900 overflow-hidden mb-4">
                    {cleanImage(item.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cleanImage(item.image)!} alt={item.title} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    ) : (
                      <ImageFallback seed={item.source} label={item.source} />
                    )}
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                      {item.source}
                    </div>
                  </div>
                  <h3 className="text-[14px] font-bold text-white leading-snug group-hover:text-blue-300 transition-colors line-clamp-3 mb-1">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] text-blue-200/60 line-clamp-2">{item.description}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Native sponsored recommendations */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-100">
        <AdsterraNativeBanner domain="lavaguetech.com" transparent />
      </div>

      {/* Footer ad */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdBanner position="HOME_FOOTER" initialBanners={banners.footer as never[]} />
      </div>

    </div>
  );
}
