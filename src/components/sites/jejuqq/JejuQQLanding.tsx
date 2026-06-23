"use client";

import { AdBanner, type Banner } from "@/components/AdBanner";
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { ChevronRight, TrendingUp, ChevronLeft, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHeroCarousel } from "@/hooks/useHeroCarousel";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import type { Article } from "@/lib/types";

interface Props {
  tenantId: string | null;
  articles: Article[];
  banners: {
    top: Banner[];
    sidebar: Banner[];
    footer: Banner[];
  };
}

export default function JejuQQLanding({ articles, banners }: Props) {
  const tenantConfig = ADSTERRA_CONFIG.jejuqq;
  const adKeys = tenantConfig.banners;
  const showSkyscrapers = adKeys["160x600"] && adKeys["160x600"].length > 0;

  const sortedArticles = [...articles].sort((a, b) => {
    if (!!b.isHeadline !== !!a.isHeadline) {
      return b.isHeadline ? 1 : -1;
    }
    if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const heroArticles = sortedArticles.slice(0, 5);
  const heroIds = new Set(heroArticles.map(a => a.id));

  const allLatestArticles = sortedArticles.filter(a => !heroIds.has(a.id));
  const latestStories = allLatestArticles.slice(0, 16);

  const moreHeadlines = allLatestArticles.slice(16, 28);
  const photoStories = allLatestArticles.slice(28, 34);
  const inDepthStories = allLatestArticles.slice(34, 46);
  const usedLeftIds = new Set([
    ...latestStories.map(a => a.id),
    ...moreHeadlines.map(a => a.id),
    ...photoStories.map(a => a.id),
    ...inDepthStories.map(a => a.id),
  ]);
  const footerStripArticles = allLatestArticles
    .filter(a => !usedLeftIds.has(a.id))
    .slice(0, 12);

  const trendingArticles = sortedArticles
    .filter(a => !heroIds.has(a.id))
    .slice(0, 10);
  const trendingIds = new Set(trendingArticles.map(a => a.id));

  const sidebarPool = sortedArticles.filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id));
  const sidebarPicks = sidebarPool.slice(0, 10);
  // Updates shows the next set so it doesn't collapse to 1-2 items
  const sidebarMore = sidebarPool.slice(10, 20);

  const featuredArticles = articles.slice(0, 4);
  const trendingProducts = articles.filter((a) => a.status === "blog").slice(0, 4);

  // Group remaining articles by category for additional category blocks
  const categoryBuckets = sortedArticles.reduce((acc: Record<string, Article[]>, article) => {
    const categoryName = article.category?.categoryName || "More Stories";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(article);
    return acc;
  }, {});

  const categorySections = Object.entries(categoryBuckets)
    .filter(([, list]) => list.length > 0)
    .slice(0, 4);

  const otherCategorySections = Object.entries(categoryBuckets)
    .filter(([, list]) => list.length > 0)
    .slice(4, 8);

  const { index, direction, paginate, goTo } = useHeroCarousel(heroArticles.length);
  const mainArticle = heroArticles[index];

  if (articles.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#fdf2f2] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl font-bold font-serif text-[#222] mb-2">最新记事暂无。</p>
          <p className="text-sm text-gray-500 mt-1">请稍后再来查看济州的最新新闻。</p>
        </div>
      </div>
    );
  }

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <div className="bg-[#fdf2f2] text-[#222] min-h-screen flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 pt-2">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
        
        {/* Adsterra Top Leaderboard Banner */}
        {adKeys["728x90"] && adKeys["320x50"] && (
          <div className="w-full flex justify-center mt-2">
            <div className="hidden sm:block">
              <AdsterraBanner bannerKey={adKeys["728x90"]} width={728} height={90} className="!my-0" />
            </div>
            <div className="block sm:hidden">
              <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} className="!my-0" />
            </div>
          </div>
        )}
      </div>

      <main className="w-full flex-1 max-w-7xl mx-auto px-4 py-4 md:py-6 relative">
        {/* Floating Left Gutter Skyscraper */}
        {showSkyscrapers && (
          <div className="hidden min-[1650px]:block absolute right-full mr-6 top-32 bottom-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        )}

        {/* Floating Right Gutter Skyscraper */}
        {showSkyscrapers && (
          <div className="hidden min-[1650px]:block absolute left-full ml-6 top-32 bottom-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        )}
        {/* Main Article Section (Hero) - Full Width */}
        {mainArticle && (
          <div className="mb-4 md:mb-6 relative group">
            <div className="flex flex-col lg:flex-row-reverse gap-5 lg:gap-8 items-center">
              <div className="relative w-full lg:w-3/5 aspect-[16/9] overflow-hidden rounded-none bg-gray-100 shadow-lg group/image shrink-0 border-2 border-primary">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={index}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ x: { type: "spring", stiffness: 200, damping: 25 }, opacity: { duration: 0.2 } }}
                    className="absolute inset-0 h-full w-full"
                  >
                    <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="block h-full w-full">
                      <StoryImage
                        src={mainArticle.imageUrl}
                        alt={mainArticle.title}
                        fill
                        className="object-cover"
                        variant="hero"
                      />
                    </Link>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <button type="button" onClick={() => paginate(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-[#dc2626] text-black hover:text-white rounded-none flex items-center justify-center shadow-md transition-colors" aria-label="Previous">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => paginate(1)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-[#dc2626] text-black hover:text-white rounded-none flex items-center justify-center shadow-md transition-colors" aria-label="Next">
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                  {heroArticles.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goTo(i)}
                      className={`h-1.5 transition-all duration-300 rounded-none ${i === index ? "w-8 bg-primary" : "w-2 bg-white/60 hover:bg-white"}`}
                      aria-label={`Go to slide ${i + 1}`}
                      aria-current={i === index ? "true" : undefined}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center py-2 min-w-0 w-full">
                <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="h-0.5 w-8 bg-primary"></span>
                    <span className="text-[11px] text-primary font-bold font-serif uppercase tracking-[0.3em]">{mainArticle.category?.categoryName}</span>
                  </div>
                  <h2 className="text-[26px] sm:text-[36px] md:text-[44px] lg:text-[52px] font-serif font-bold leading-[1.08] mb-2 group-hover:text-primary transition-colors tracking-tighter break-words">
                    {mainArticle.title}
                  </h2>
                </Link>
                <p className="text-gray-800 text-base leading-relaxed mb-4 line-clamp-3 font-medium">
                  {mainArticle.content
                    ? mainArticle.content.replace(/<[^>]*>/g, "").slice(0, 200)
                    : ""}
                </p>
                <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-black hover:text-[#dc2626] transition-colors">
                  Read Full Story <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Left Content Area (Latest Stories) */}
          <div className="lg:col-span-8">
            {/* Latest Stories Section */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl md:text-3xl font-serif font-bold uppercase tracking-tight">Latest Stories</h3>
                <div className="h-1 flex-1 mx-6 bg-gray-100 overflow-hidden">
                  <div className="h-full w-24 bg-primary"></div>
                </div>
              </div>

              {/* Top Half: 3-Column Grid (Image on Top) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 pb-10 border-b border-gray-200">
                {latestStories.slice(0, 6).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug || article.id}`}
                    className="group block"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden border border-gray-200 mb-3 bg-gray-50 shadow-sm group-hover:shadow-md transition-all">
                      <StoryImage
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      {/* Optional: Watch tag for specific categories */}
                      {article.category?.categoryName?.toLowerCase().includes('video') && (
                        <div className="absolute top-2 left-2 bg-[#dc2626] text-white text-[10px] font-black px-1.5 py-0.5 uppercase">Watch</div>
                      )}
                    </div>
                    <h4 className="text-[17px] font-serif font-black leading-tight group-hover:text-primary transition-colors line-clamp-3 mb-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-bold">
                      <Clock size={12} className="text-gray-400" />
                      <span>4 min read</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mid-Feed Adsterra Placement */}
              {tenantConfig.midFeed && (
                <div className="my-2 py-2 flex justify-center w-full border-y border-gray-100 mb-10">
                  <AdsterraBanner
                    bannerKey={tenantConfig.midFeed.key}
                    width={tenantConfig.midFeed.width}
                    height={tenantConfig.midFeed.height}
                    className="!my-0"
                  />
                </div>
              )}

              {/* Bottom Half: Creative 2-Column Grid (Image on Left) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-8">
                {latestStories.slice(6).map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug || article.id}`}
                    className="group block relative"
                  >
                    <div className="flex gap-4 sm:gap-6 items-start p-3 -m-3 transition-all duration-300 hover:bg-white/50 border border-transparent hover:border-primary/10">
                      <div className="relative w-28 sm:w-36 md:w-32 lg:w-36 aspect-[4/3] shrink-0">
                        {/* Decorative offset background */}
                        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-primary/10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                        <div className="relative h-full w-full overflow-hidden border-2 border-primary bg-gray-50">
                          <StoryImage
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            sizes="(max-width: 768px) 140px, 160px"
                          />
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                        </div>
                      </div>

                      <div className="min-w-0 pt-0.5 flex-1 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] text-primary font-bold font-serif uppercase tracking-[0.2em]">
                            {article.category?.categoryName}
                          </span>
                          <span className="h-[1px] w-0 group-hover:w-8 bg-primary transition-all duration-500" />
                        </div>

                        <h4 className="text-[16px] md:text-[18px] font-serif font-bold leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-2">
                          {article.title}
                        </h4>

                        <p className="text-gray-800 text-[12px] md:text-[13px] line-clamp-2 leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                          {article.content}
                        </p>

                        {/* Large Background Index */}
                        <span className="absolute -right-2 -bottom-3 text-6xl font-serif font-black text-primary/[0.03] select-none pointer-events-none group-hover:text-primary/[0.07] transition-all duration-500 group-hover:-translate-y-1 tabular-nums">
                          {String(i + 7).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* More blocks under Latest Stories */}
              {(moreHeadlines.length > 0 || photoStories.length > 0) && (
                <div className="mt-2 space-y-2">
                  {/* More Headlines (dense list) */}
                  {moreHeadlines.length > 0 && (
                    <section className="bg-white/60 border border-gray-200 px-4 md:px-5 py-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="h-0.5 w-8 bg-primary"></span>
                          <h3 className="text-lg md:text-xl font-serif font-bold uppercase tracking-tight">
                            More Headlines
                          </h3>
                        </div>
                        <span className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-500">
                          Quick Reads
                        </span>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {moreHeadlines.map((article, i) => (
                          <Link
                            key={article.id}
                            href={`/article/${article.slug || article.id}`}
                            className="group grid grid-cols-[22px_1fr] gap-3 py-2.5"
                          >
                            <span className="text-[11px] font-black text-primary/70 tabular-nums leading-none pt-0.5">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold font-serif text-primary uppercase tracking-[0.2em]">
                                  {article.category?.categoryName}
                                </span>
                                <span className="h-1 w-1 bg-primary/60"></span>
                                <span className="text-[10px] text-gray-500">
                                  {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ""}
                                </span>
                              </div>
                              <h4 className="text-[13px] md:text-[14px] font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                {article.title}
                              </h4>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Photo Stories (compact image grid) */}
                  {photoStories.length > 0 && (
                    <section className="border-t border-gray-200 pt-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="h-0.5 w-8 bg-primary"></span>
                          <h3 className="text-lg md:text-xl font-serif font-bold uppercase tracking-tight">
                            Photo Stories
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {photoStories.map((article) => (
                          <Link
                            key={article.id}
                            href={`/article/${article.slug || article.id}`}
                            className="group"
                          >
                            <div className="relative aspect-[4/3] overflow-hidden border-2 border-primary bg-gray-50 mb-2">
                              <StoryImage
                                src={article.imageUrl}
                                alt={article.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 50vw, 240px"
                              />
                            </div>
                            <h4 className="text-[13px] md:text-[14px] font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h4>
                            <span className="text-[9px] text-primary font-bold font-serif uppercase tracking-[0.2em]">
                              {article.category?.categoryName}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* In Depth (compact feed to remove empty space) */}
                  {inDepthStories.length > 0 && (
                    <section className="bg-gray-50 border-2 border-primary p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="h-0.5 w-8 bg-primary"></span>
                          <h3 className="text-lg md:text-xl font-serif font-bold uppercase tracking-tight">
                            In Depth
                          </h3>
                        </div>
                        <span className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-500">
                          Keep Reading
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {inDepthStories.slice(0, 6).map((article) => (
                          <Link
                            key={article.id}
                            href={`/article/${article.slug || article.id}`}
                            className="group flex gap-3 items-start"
                          >
                            <div className="relative w-24 sm:w-28 aspect-[4/3] overflow-hidden border-2 border-primary bg-white shrink-0">
                              <StoryImage
                                src={article.imageUrl}
                                alt={article.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="140px"
                              />
                            </div>
                            <div className="min-w-0 pt-0.5">
                              <span className="text-[9px] text-primary font-bold font-serif uppercase tracking-[0.2em] block mb-1">
                                {article.category?.categoryName}
                              </span>
                              <h4 className="text-[13px] md:text-[14px] font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                {article.title}
                              </h4>
                              <p className="text-[12px] text-gray-800 leading-relaxed line-clamp-1 mt-1">
                                {article.content}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Sections (kept inside left column to avoid empty gap) */}
            <div className="mt-4 md:mt-6 space-y-4 md:space-y-6">
              {/* Featured Articles */}
              {featuredArticles.length > 0 && (
                <section className="pt-1 border-t border-gray-200">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-2xl md:text-3xl font-garamond font-bold uppercase tracking-tight whitespace-nowrap">Spotlight</h3>
                    <div className="h-1 flex-1 bg-[#dc2626]/10 overflow-hidden">
                      <div className="h-full w-1/4 bg-[#dc2626]"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {featuredArticles.map((article) => (
                      <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-none mb-3 bg-gray-50 border-2 border-[#dc2626]">
                          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                        </div>
                        <span className="text-[9px] text-[#dc2626] font-black uppercase mb-1.5 block tracking-widest">{article.category?.categoryName}</span>
                        <h4 className="text-[13px] md:text-[15px] font-garamond font-bold leading-tight group-hover:text-[#dc2626] transition-colors line-clamp-2">{article.title}</h4>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Trending Products / Blogs */}
              {trendingProducts.length > 0 && (
                <section className="bg-black rounded-none p-5 md:p-6 lg:p-8 text-white overflow-hidden relative">
                  <h3 className="text-2xl md:text-3xl font-garamond font-bold mb-5 flex items-center gap-4 relative z-10">Explore More <span className="h-1 w-16 bg-[#dc2626]"></span></h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 relative z-10">
                    {trendingProducts.map((article) => (
                      <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group bg-white/5 border border-white/10 p-3 md:p-4 rounded-none hover:bg-[#dc2626] transition-colors">
                        <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-none">
                          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <h4 className="text-[13px] md:text-[14px] font-bold leading-tight line-clamp-2 mb-1.5">{article.title}</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#dc2626] group-hover:text-white transition-colors">Discover</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Category Highlights */}
              {categorySections.length > 0 && (
                <section className="pt-1 border-t border-gray-200">
                  <div className="space-y-5">
                    {categorySections.map(([categoryName, list]) => {
                      const items = list.slice(0, 5);
                      return (
                        <div key={categoryName} className="bg-white/60 border border-gray-200 px-4 sm:px-5 md:px-6 py-4 md:py-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <span className="h-0.5 w-8 bg-primary"></span>
                              <h4 className="text-xl md:text-2xl font-serif font-bold tracking-tight uppercase">
                                {categoryName}
                              </h4>
                            </div>
                            <span className="text-[10px] md:text-xs font-black tracking-[0.25em] uppercase text-gray-500 whitespace-nowrap">
                              Curated Picks
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
                            {/* Lead story */}
                            {items[0] && (
                              <Link
                                key={items[0].id}
                                href={`/article/${items[0].slug || items[0].id}`}
                                className="group lg:col-span-7 flex flex-col"
                              >
                                <div className="relative aspect-[16/10] overflow-hidden border-2 border-primary bg-gray-50 mb-3">
                                  <StoryImage
                                    src={items[0].imageUrl}
                                    alt={items[0].title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                                <span className="text-[9px] text-primary font-bold font-serif uppercase tracking-[0.25em] mb-1.5">
                                  {items[0].category?.categoryName}
                                </span>
                                <h5 className="font-serif font-bold leading-tight mb-1.5 group-hover:text-primary transition-colors text-base md:text-lg line-clamp-2">
                                  {items[0].title}
                                </h5>
                                <p className="text-[12px] text-gray-800 line-clamp-2 leading-relaxed font-medium">
                                  {items[0].content}
                                </p>
                              </Link>
                            )}

                            {/* Compact list (always fills, no empty cells) */}
                            <div className="lg:col-span-5 space-y-2.5">
                              {items.slice(1).map((article) => (
                                <Link
                                  key={article.id}
                                  href={`/article/${article.slug || article.id}`}
                                  className="group flex gap-3 items-start"
                                >
                                  <div className="relative w-20 aspect-[4/3] overflow-hidden border-2 border-primary bg-gray-50 shrink-0">
                                    <StoryImage
                                      src={article.imageUrl}
                                      alt={article.title}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                                      sizes="96px"
                                    />
                                  </div>
                                  <div className="min-w-0 pt-0.5">
                                    <span className="text-[9px] text-primary font-bold font-serif uppercase tracking-[0.25em] block mb-1">
                                      {article.category?.categoryName}
                                    </span>
                                    <h5 className="text-[13px] md:text-[14px] font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                      {article.title}
                                    </h5>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}




            </div>
          </div>

          {/* Right Sidebar (Trending + Ad) */}
          <aside className="lg:col-span-4">
            <div className="space-y-5">
              {/* Sidebar Stack (Trending + Updates + Must Read) */}
              <div className="space-y-5">
                {/* Trending */}
                <div className="bg-gray-50 rounded-none p-4 md:p-5 border-2 border-primary">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                      Trending <TrendingUp size={20} className="text-primary" />
                    </h3>
                    <span className="w-2 h-2 rounded-none bg-primary"></span>
                  </div>

                  <div className="space-y-4">
                    {trendingArticles.map((article, i) => (
                      <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-3 items-start group">
                        <span className="text-2xl font-serif font-bold text-primary/70 group-hover:text-primary transition-colors tabular-nums shrink-0 leading-none">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold font-serif text-primary uppercase tracking-[0.2em] block mb-1">{article.category?.categoryName}</span>
                          <h4 className="text-[13px] md:text-[14px] font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* More Vertical Stories */}
                {sidebarMore.length > 0 && (
                  <div className="bg-gray-50 rounded-none p-4 md:p-5 border-2 border-primary">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-serif font-bold flex items-center gap-2">
                        Updates <span className="w-2 h-2 rounded-none bg-primary"></span>
                      </h3>
                      <span className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-500">
                        New
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {sidebarMore.map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.slug || article.id}`}
                          className="group flex gap-3 items-start"
                        >
                          <div className="relative w-16 aspect-[4/3] overflow-hidden border-2 border-primary bg-white shrink-0">
                            <StoryImage
                              src={article.imageUrl}
                              alt={article.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="96px"
                            />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <span className="text-[9px] font-bold font-serif text-primary uppercase tracking-[0.2em] block mb-1">
                              {article.category?.categoryName}
                            </span>
                            <h4 className="text-[13px] font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                              {article.title}
                            </h4>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Must Read Section */}
                {sidebarPicks.length > 0 && (
                  <div className="bg-gray-50 rounded-none p-4 md:p-5 border-2 border-primary">
                    <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                      Must Read <span className="w-2 h-2 bg-primary"></span>
                    </h3>
                    <div className="space-y-4">
                      {sidebarPicks.map((article) => (
                        <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                          <div className="relative aspect-[16/9] overflow-hidden border-2 border-primary mb-2.5">
                            <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <span className="text-[9px] font-bold font-serif text-primary uppercase tracking-widest block mb-1">{article.category?.categoryName}</span>
                          <h4 className="text-[13px] md:text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-hidden">
                <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
              </div>
            </div>
          </aside>
        </div>

        {/* Other Categories 4-Column Grid (Full Width) */}
        {otherCategorySections.length > 0 && (
          <section className="mt-10 pt-8 border-t-2 border-primary/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {otherCategorySections.map(([categoryName, list]) => {
                const items = list.slice(0, 4);
                const lead = items[0];
                const subItems = items.slice(1);

                return (
                  <div key={categoryName} className="flex flex-col">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-2 h-2 bg-primary"></span>
                      <h4 className="text-xl font-serif font-black uppercase tracking-tight">
                        {categoryName}
                      </h4>
                    </div>

                    {lead && (
                      <Link href={`/article/${lead.slug || lead.id}`} className="group block mb-6">
                        <div className="relative aspect-[16/10] overflow-hidden border-2 border-primary bg-gray-50 shadow-md group-hover:shadow-lg transition-all duration-300 mb-5">
                          <StoryImage
                            src={lead.imageUrl}
                            alt={lead.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        <h5 className="text-[20px] md:text-[22px] font-serif font-bold leading-tight group-hover:text-primary transition-colors line-clamp-3">
                          {lead.title}
                        </h5>
                      </Link>
                    )}

                    <div className="space-y-5">
                      {subItems.map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.slug || article.id}`}
                          className="group flex gap-4 items-start pt-4 border-t border-gray-200"
                        >
                          <div className="flex-1 min-w-0">
                            <h6 className="text-[14px] md:text-[15px] font-bold leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                              {article.title}
                            </h6>
                          </div>
                          {article.imageUrl && (
                            <div className="relative w-20 h-14 overflow-hidden border border-gray-100 shrink-0">
                              <StoryImage
                                src={article.imageUrl}
                                alt={article.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Horizontal articles strip (between categories and footer) */}
        {footerStripArticles.length > 0 && (
          <section className="mt-2 pt-1 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="h-0.5 w-8 bg-primary"></span>
                <h3 className="text-lg md:text-xl font-serif font-bold uppercase tracking-tight">
                  More Stories
                </h3>
              </div>
              <span className="text-[10px] md:text-xs font-black tracking-[0.25em] uppercase text-gray-500 whitespace-nowrap">
                Swipe
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-hide">
              {footerStripArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug || article.id}`}
                  className="group snap-start shrink-0 w-[240px] sm:w-[260px] bg-white/60 border border-gray-200 p-3"
                >
                  <div className="relative aspect-[16/10] overflow-hidden border-2 border-primary bg-gray-50 mb-2.5">
                    <StoryImage
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="260px"
                    />
                  </div>
                  <span className="text-[9px] text-primary font-bold font-serif uppercase tracking-[0.25em] block mb-1">
                    {article.category?.categoryName}
                  </span>
                  <h4 className="text-[13px] md:text-[14px] font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Native Recommendations Widget */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <AdsterraNativeBanner domain="jejuqq.com" />
        </div>
      </main>
    </div>
  );
}
