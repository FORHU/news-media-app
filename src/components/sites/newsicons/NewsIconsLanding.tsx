import { AdBanner } from "@/components/AdBanner";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getCoreCategories, normalizeCategoryKey } from "@/config/categories";
import type { RssArticle } from "@/lib/rss";
import type { MediaStackArticle } from "@/lib/mediastack";

const TrendingProductsSection = dynamic(() => import("@/components/home/trending-products-section").then(m => m.TrendingProductsSection), { ssr: true });

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
  banners: {
    top: any[];
    sidebar: any[];
    footer: any[];
  };
  rssArticles?: RssArticle[];
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

const NEWSICONS_CATEGORIES = getCoreCategories("newsicons.com");
const CANONICAL_MAP = new Map(
  NEWSICONS_CATEGORIES.map((c) => [normalizeCategoryKey(c), c.trim()])
);


export default function NewsIconsLanding({ articles, banners, rssArticles = [], mediastackArticles = [] }: Props) {
  const sorted = [...articles].sort((a, b) => {
    const aH = a.isHeadline ? 1 : 0;
    const bH = b.isHeadline ? 1 : 0;
    if (bH !== aH) return bH - aH;
    if ((b.trendingScore || 0) !== (a.trendingScore || 0))
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const heroIds = new Set(sorted[0] ? [sorted[0].id] : []);
  // Headline article — exclude from category blocks
  const latestNewsIds = heroIds;

  const groupedMap = new Map<string, ArticleRow[]>();
  for (const a of sorted) {
    if (latestNewsIds.has(a.id)) continue;
    const raw = a.category?.categoryName || "Uncategorized";
    const cat = CANONICAL_MAP.get(normalizeCategoryKey(raw)) ?? raw;
    if (!groupedMap.has(cat)) groupedMap.set(cat, []);
    groupedMap.get(cat)!.push(a);
  }
  const categoryBlocks = Array.from(groupedMap.entries())
    .map(([name, items]) => ({ name, items }))
    .filter((g) => g.items.length >= 1);

  if (articles.length === 0) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl font-serif font-bold text-slate-800 mb-2">No stories available yet.</p>
          <p className="text-sm text-slate-400 mt-1">Check back soon for the latest from NewsIcons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 relative">
      {/* Left gutter skyscraper */}
      <div className="hidden min-[1650px]:block absolute right-[50%] mr-[660px] top-32 bottom-32 w-[160px] z-30">
        <div className="sticky top-40">
          <AdsterraBanner bannerKey={ADSTERRA_CONFIG.newsicons.banners["160x600"]} width={160} height={600} />
        </div>
      </div>
      {/* Right gutter skyscraper */}
      <div className="hidden min-[1650px]:block absolute left-[50%] ml-[660px] top-32 bottom-32 w-[160px] z-30">
        <div className="sticky top-40">
          <AdsterraBanner bannerKey={ADSTERRA_CONFIG.newsicons.banners["160x600"]} width={160} height={600} />
        </div>
      </div>

      {/* Top Ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-14">

        {/* Headline */}
        {sorted[0] && (
          <Link href={articleHref(sorted[0])} className="group block bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[360px] bg-slate-100 overflow-hidden">
                <StoryImage
                  src={sorted[0].imageUrl}
                  alt={sorted[0].title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-col justify-center p-8 lg:p-10">
                <span className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-3">
                  {sorted[0].category?.categoryName ?? "News"}
                </span>
                <h1 className="text-3xl lg:text-4xl font-serif font-black text-slate-900 leading-tight group-hover:text-orange-500 transition-colors mb-4">
                  {sorted[0].title}
                </h1>
                <p className="text-[15px] text-slate-600 leading-relaxed line-clamp-4">
                  {excerpt(sorted[0].content, 280)}
                </p>
                <span className="text-[12px] text-slate-400 font-medium mt-6">
                  {new Date(sorted[0].createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Latest News + Around the Web — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Latest Stories — left */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-900 pb-3">
              <h2 className="text-xl font-serif font-black text-slate-900 uppercase tracking-wide">Latest News</h2>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="flex flex-col divide-y divide-slate-200">
              {(() => {
                const allItems = sorted.slice(1, 13);
                const items = allItems.slice(0, allItems.length - 1);
                const lastItem = allItems[allItems.length - 1];
                const blocks: React.ReactNode[] = [];
                let i = 0;

                while (i < items.length) {
                  const isFeatured = i === 0 || i % 3 === 0;

                  if (isFeatured && items[i]) {
                    const a = items[i];
                    blocks.push(
                      <Link
                        key={a.id}
                        href={articleHref(a)}
                        className="group flex flex-col sm:flex-row gap-4 sm:gap-5 items-start py-6 first:pt-0"
                      >
                        <div className="relative w-full sm:w-[300px] h-[200px] shrink-0 bg-slate-100 overflow-hidden">
                          <StoryImage
                            src={a.imageUrl}
                            alt={a.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="300px"
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                            {a.category?.categoryName ?? "News"}
                          </span>
                          <h3 className="text-[20px] font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-3">
                            {a.title}
                          </h3>
                          <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3">
                            {excerpt(a.content, 160)}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium mt-auto">
                            {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </Link>
                    );
                    i += 1;
                  } else {
                    const pair = items.slice(i, i + 2);
                    blocks.push(
                      <div key={`pair-${i}`} className="grid grid-cols-2 gap-4 py-6">
                        {pair.map((a) => (
                          <Link key={a.id} href={articleHref(a)} className="group flex flex-col gap-2">
                            <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                              <StoryImage
                                src={a.imageUrl}
                                alt={a.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 640px) 50vw, 33vw"
                              />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                              {a.category?.categoryName ?? "News"}
                            </span>
                            <h4 className="text-[15px] font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-3">
                              {a.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </Link>
                        ))}
                      </div>
                    );
                    i += 2;
                  }
                }

                {/* Last article — full-width lengthwise */}
                if (lastItem) {
                  blocks.push(
                    <Link
                      key={lastItem.id}
                      href={articleHref(lastItem)}
                      className="group flex flex-col sm:flex-row gap-0 items-stretch py-6 border-t border-slate-200"
                    >
                      <div className="relative w-full sm:w-1/2 min-h-[180px] shrink-0 bg-slate-100 overflow-hidden">
                        <StoryImage
                          src={lastItem.imageUrl}
                          alt={lastItem.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="50vw"
                        />
                      </div>
                      <div className="flex flex-col justify-center gap-2 flex-1 min-w-0 pt-4 sm:pt-0 sm:pl-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                          {lastItem.category?.categoryName ?? "News"}
                        </span>
                        <h3 className="text-[22px] font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-3">
                          {lastItem.title}
                        </h3>
                        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3">
                          {excerpt(lastItem.content, 200)}
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium mt-auto">
                          {new Date(lastItem.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </Link>
                  );
                }

                return blocks;
              })()}
            </div>
          </div>

          {/* News Wire — right sidebar */}
          {mediastackArticles.length > 0 && (
            <aside className="lg:col-span-4 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-5 border-b-2 border-orange-500 pb-3">
                <h2 className="text-xl font-serif font-black text-slate-900 uppercase tracking-wide">News Wire</h2>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="flex flex-col divide-y divide-slate-200 bg-white border border-slate-200 shadow-sm flex-1 overflow-y-auto">
                {mediastackArticles.slice(0, 10).map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 items-center p-4 hover:bg-slate-50 transition-colors flex-1"
                  >
                    {item.image ? (
                      <div className="relative w-[90px] h-[76px] shrink-0 bg-slate-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="w-[90px] h-[76px] shrink-0 bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-400 text-[9px] font-bold uppercase text-center px-1 leading-tight">{item.source}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500 truncate">{item.source}</span>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </a>
                ))}
              </div>
            </aside>
          )}

        </div>

        {/* Mid-feed banner */}
        <div className="flex justify-center py-4 border-y border-slate-100 bg-slate-50/30 w-full">
          <div className="hidden sm:block">
            <AdsterraBanner bannerKey={ADSTERRA_CONFIG.newsicons.banners["728x90"]} width={728} height={90} className="!my-0" />
          </div>
          <div className="block sm:hidden">
            <AdsterraBanner bannerKey={ADSTERRA_CONFIG.newsicons.banners["320x50"]} width={320} height={50} className="!my-0" />
          </div>
        </div>

        {/* Trending Now — API articles 10–13 */}
        {mediastackArticles.length > 10 && (
          <section>
            <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-900 pb-3">
              <h2 className="text-xl font-serif font-black text-slate-900 uppercase tracking-wide">Trending Now</h2>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mediastackArticles.slice(10, 14).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-xs font-bold uppercase px-2 text-center">{item.source}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-1">{item.source}</span>
                    <h3 className="text-[15px] font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-3">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-[12px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* In the Headlines — API articles 14–19 */}
        {mediastackArticles.length > 14 && (
          <section>
            <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-900 pb-3">
              <h2 className="text-xl font-serif font-black text-slate-900 uppercase tracking-wide">In the Headlines</h2>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediastackArticles.slice(14, 20).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4 items-start bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-[90px] h-[70px] shrink-0 bg-slate-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-[9px] font-bold uppercase text-center px-1">{item.source}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-1">{item.source}</span>
                    <h4 className="text-[14px] font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-3">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[12px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* From the Wire — API articles 20–29 */}
        {mediastackArticles.length > 20 && (
          <section>
            <div className="flex items-center gap-3 mb-6 border-b-2 border-orange-500 pb-3">
              <h2 className="text-xl font-serif font-black text-slate-900 uppercase tracking-wide">From the Wire</h2>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white border border-slate-200 shadow-sm divide-y divide-slate-200">
              {mediastackArticles.slice(20, 30).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4 items-center p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-[80px] h-[60px] shrink-0 bg-slate-100 overflow-hidden">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-[9px] font-bold uppercase text-center px-1">{item.source}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500 truncate">{item.source}</span>
                      <span className="text-[9px] text-slate-400 shrink-0">
                        {new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <h4 className="text-[14px] font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Category Blocks */}
        {categoryBlocks.map((group) => {
          const lead = group.items[0];
          const rest = group.items.slice(1, 4);
          return (
            <section key={group.name}>
              <div className="flex items-center gap-3 mb-6 border-b-2 border-orange-500 pb-3">
                <h2 className="text-xl font-serif font-black text-slate-900 uppercase tracking-wide">{group.name}</h2>
                <div className="flex-1 h-px bg-slate-200" />
                <Link
                  href={`/search?category=${encodeURIComponent(group.name)}`}
                  className="text-[11px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors shrink-0"
                >
                  See All →
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Lead */}
                <Link href={articleHref(lead)} className="lg:col-span-5 group block bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                    <StoryImage
                      src={lead.imageUrl}
                      alt={lead.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 42vw"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-2">
                      {lead.category?.categoryName ?? group.name}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors mb-3">
                      {lead.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {excerpt(lead.content, 160)}
                    </p>
                  </div>
                </Link>

                {/* Side articles */}
                {rest.length > 0 && (
                  <div className="lg:col-span-7 flex flex-col divide-y divide-slate-200 bg-white border border-slate-200 shadow-sm">
                    {rest.map((article) => (
                      <Link key={article.id} href={articleHref(article)} className="group flex gap-4 items-start p-4 hover:bg-slate-50 transition-colors">
                        <div className="relative w-[110px] h-[78px] shrink-0 bg-slate-100 overflow-hidden">
                          <StoryImage
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="110px"
                          />
                        </div>
                        <div className="min-w-0 flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                            {article.category?.categoryName ?? group.name}
                          </span>
                          <h4 className="text-[15px] font-serif font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                            {excerpt(article.content, 80)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* Blog / Trending Products */}
        <TrendingProductsSection
          articles={articles.filter((a: any) => a.status === "blog").slice(0, 4) as any}
        />

        {/* Native banner */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <AdsterraNativeBanner domain="newsicons.com" />
        </div>

      </main>
    </div>
  );
}
