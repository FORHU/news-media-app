"use client";

import dynamic from "next/dynamic";
const AdBanner = dynamic(() => import("@/components/AdBanner").then(mod => mod.AdBanner), { 
  ssr: true,
  loading: () => <div className="h-[120px] animate-pulse bg-gray-50 flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-widest" />
});

import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { TrendingUp, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
const MotionDiv = dynamic(() => import("framer-motion").then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import("framer-motion").then(mod => mod.AnimatePresence), { ssr: false });

interface Props {
  tenantId: string | null;
  articles: any[];
  banners: {
    top: any[];
    sidebar: any[];
    footer: any[];
  };
}

export default function JejuJapanLanding({ tenantId, articles, banners }: Props) {

  const sortedArticles = [...articles].sort((a, b) => {
    if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const heroArticles = articles.slice(0, 5);
  const heroIds = new Set(heroArticles.map(a => a.id));

  // Pool of non-hero articles (sorted by trending/date)
  const pool = sortedArticles.filter(a => !heroIds.has(a.id));

  // Helper: pick unique articles from pool, but allow duplicates if not enough
  const pickArticles = (count: number, excludeIds: Set<string>) => {
    const unique = pool.filter(a => !excludeIds.has(a.id));
    if (unique.length >= count) return unique.slice(0, count);
    // Not enough unique — fill remaining with duplicates from pool
    const remaining = count - unique.length;
    return [...unique, ...pool.filter(a => excludeIds.has(a.id)).slice(0, remaining)];
  };

  // Track used IDs as we go — each section tries to avoid previous ones
  const usedIds = new Set<string>([...heroIds]);

  // Right sidebar — Trending: top 10
  const trendingArticles = pickArticles(10, usedIds);
  trendingArticles.forEach(a => usedIds.add(a.id));

  // Right sidebar — Must Read: next 5
  const sidebarPicks = pickArticles(5, usedIds);
  sidebarPicks.forEach(a => usedIds.add(a.id));

  // Left sidebar — 8 articles
  const leftSidebarArticles = pickArticles(8, usedIds);
  leftSidebarArticles.forEach(a => usedIds.add(a.id));

  // Center — Latest Stories (fixed 15)
  const uniqueLatest = pool.filter(a => !usedIds.has(a.id));
  const allLatestArticles = uniqueLatest.length > 0 ? uniqueLatest : pool;
  const latestStories = allLatestArticles.slice(0, 15);
  latestStories.forEach(a => usedIds.add(a.id));

  // Horizontal strip — after pagination, before featured
  const horizontalStrip = pickArticles(5, usedIds);
  horizontalStrip.forEach(a => usedIds.add(a.id));

  // Bottom — Featured Report
  const featuredArticles = pickArticles(4, usedIds);

  // Bottom — Discover / Blog
  const trendingProducts = articles
    .filter((a: any) => a.status === "blog")
    .slice(0, 4);

  // Category sections — group all articles by category, show top 4 categories
  const categoryMap = new Map<string, any[]>();
  articles.forEach(a => {
    const catName = a.category?.categoryName;
    if (!catName) return;
    if (!categoryMap.has(catName)) categoryMap.set(catName, []);
    categoryMap.get(catName)!.push(a);
  });
  const categoryBlocks = Array.from(categoryMap.entries())
    .filter(([_, items]) => items.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)
    .map(([name, items]) => ({ name, articles: items.slice(0, 4) }));

  const [[page, direction], setPage] = useState([0, 0]);
  const index = heroArticles.length > 0 ? Math.abs(page % heroArticles.length) : 0;
  const heroArticle = heroArticles[index];

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <div className="bg-white text-black font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Left Sidebar — Article List */}
            <aside className="hidden lg:block lg:col-span-2">
              <div className="sticky top-24">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 pb-3 border-b-2 border-[#bc002d] flex items-center gap-2">
                  <Clock size={14} className="text-[#bc002d]" /> Latest
                </h3>
                <div className="space-y-4">
                  {leftSidebarArticles.map((article, i) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                      <div className="relative aspect-[16/10] overflow-hidden mb-1.5 bg-gray-100">
                        <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="180px" />
                      </div>
                      <span className="text-[8px] font-black text-[#bc002d] uppercase tracking-[0.15em] block mb-0.5">{article.category?.categoryName}</span>
                      <h4 className="text-[11px] font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* Center Content Area */}
            <div className="lg:col-span-7">
              
              {/* Hero Section Carousel */}
              {heroArticle && (
                <div className="mb-6 md:mb-8">
                  <div className="relative aspect-video lg:aspect-[21/9] overflow-hidden mb-3 bg-gray-100 shadow-md">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                      <MotionDiv
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "tween", duration: 0.25 }, opacity: { duration: 0.2 } }}
                        className="h-full w-full absolute inset-0"
                      >
                        <Link href={`/article/${heroArticle.slug || heroArticle.id}`} className="block h-full">
                          <StoryImage 
                            src={heroArticle.imageUrl} 
                            alt={heroArticle.title}
                            fill
                            className="object-cover"
                            variant="hero"
                            priority={true}
                            sizes="(max-width: 1024px) 100vw, 850px"
                          />
                        </Link>
                      </MotionDiv>
                    </AnimatePresence>

                    <div className="absolute top-4 left-4 bg-[#bc002d] text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-[0.2em] z-10">
                       Top Story
                    </div>

                    <button type="button" onClick={() => paginate(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 hover:bg-white text-[#bc002d] flex items-center justify-center shadow-md transition-colors" aria-label="Previous">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => paginate(1)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 hover:bg-white text-[#bc002d] flex items-center justify-center shadow-md transition-colors" aria-label="Next">
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                      {heroArticles.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            const newDirection = i > index ? 1 : -1;
                            setPage([i, newDirection]);
                          }}
                          className={`h-1.5 transition-all duration-300 ${i === index ? "w-8 bg-[#bc002d]" : "w-3 bg-white/50 hover:bg-white/80"}`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Link href={`/article/${heroArticle.slug || heroArticle.id}`} className="block max-w-4xl">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-noto font-black leading-[1.1] mb-5 hover:text-[#bc002d] transition-colors tracking-tight">
                      {heroArticle.title}
                    </h2>
                    <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-[#bc002d] hover:text-black transition-colors">
                      Read Full Report <ChevronRight size={14} />
                    </span>
                  </Link>
                </div>
              )}

              <div className="space-y-4 border-t border-gray-100 pt-8">
                    <>
                       {/* 1 Compact Feature Card */}
                       {latestStories.length > 0 && (
                          <article className="mb-8 group">
                             <Link href={`/article/${latestStories[0].slug || latestStories[0].id}`} className="flex flex-col sm:flex-row-reverse gap-5 items-center">
                                <div className="relative w-full sm:w-1/2 aspect-[16/10] overflow-hidden shadow-md bg-gray-100 shrink-0">
                                   <StoryImage src={latestStories[0].imageUrl} alt={latestStories[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 1024px) 100vw, 500px" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 inline-block px-3 py-1 bg-[#bc002d] text-white">Featured Latest</span>
                                   <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-2 group-hover:text-[#bc002d] transition-colors tracking-tight">
                                      {latestStories[0].title}
                                   </h3>
                                </div>
                             </Link>
                          </article>
                       )}

                       {/* 3-Column Grid for next 9 items */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-7 mb-8">
                          {latestStories.slice(1, 10).map((article) => (
                             <article key={article.id} className="group">
                                <Link href={`/article/${article.slug || article.id}`}>
                                   <div className="relative aspect-[16/10] overflow-hidden mb-2 bg-gray-100">
                                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 300px" />
                                   </div>
                                   <span className="text-[9px] font-black text-[#bc002d] uppercase tracking-[0.2em] mb-0.5 block">{article.category?.categoryName}</span>
                                   <h4 className="text-sm font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h4>
                                </Link>
                             </article>
                          ))}
                       </div>

                       {/* Remaining rows — compact horizontal cards */}
                       <div className="space-y-4">
                          {latestStories.slice(10).map((article) => (
                             <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-row gap-3 group items-start border-b border-gray-50 pb-4 last:border-0">
                                <div className="relative w-24 sm:w-32 md:w-44 aspect-[16/10] overflow-hidden shrink-0 bg-gray-100">
                                   <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="200px" />
                                </div>
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                   <span className="text-[9px] font-black text-[#bc002d] uppercase tracking-[0.2em] mb-0.5 flex items-center gap-1.5">
                                      <span className="w-3 h-[1px] bg-[#bc002d]"></span>
                                      {article.category?.categoryName}
                                   </span>
                                   <h3 className="text-[15px] font-bold leading-tight mb-0.5 group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h3>
                                </div>
                             </Link>
                          ))}
                       </div>
                    </>
              </div>
            </div>

            {/* Right Sidebar */}
            <aside className="lg:col-span-3">
               <div className="bg-[#111] text-white p-6 mb-6">
                  <h3 className="text-base font-noto font-black flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-white/20 pb-4">
                     <TrendingUp size={18} className="text-[#bc002d]" /> Trending
                  </h3>
                   <div className="space-y-6">
                       {trendingArticles.map((article, i) => (
                          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                             <div className="flex gap-4">
                                <span className="text-3xl font-noto font-black text-white/30 group-hover:text-[#bc002d] transition-colors shrink-0">
                                   {String(i + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0">
                                   <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] block mb-1">{article.category?.categoryName}</span>
                                   <h4 className="text-sm font-bold leading-snug group-hover:text-white/80 line-clamp-2 transition-colors">{article.title}</h4>
                                </div>
                             </div>
                          </Link>
                       ))}
                    </div>
                </div>

                {/* Must Read Section */}
                {sidebarPicks.length > 0 && (
                   <div className="bg-white p-6 border border-gray-100 mb-6 shadow-sm">
                      <h3 className="text-base font-noto font-black flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-gray-100 pb-4">
                         Must Read <div className="w-2 h-2 bg-[#bc002d]" />
                      </h3>
                      <div className="space-y-6">
                         {sidebarPicks.map((article) => (
                            <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                               <div className="relative aspect-video overflow-hidden bg-gray-50 mb-3">
                                  <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                               </div>
                               <span className="text-[9px] font-black text-[#bc002d] uppercase tracking-[0.2em] block mb-1">{article.category?.categoryName}</span>
                               <h4 className="text-sm font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h4>
                            </Link>
                         ))}
                      </div>
                   </div>
                )}

               <div className="lg:sticky lg:top-24">
                  <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
               </div>
            </aside>

          </div>

          {/* Horizontal Article Strip */}
          {horizontalStrip.length > 0 && (
            <section className="mt-10 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-2">
                  <ChevronRight size={16} className="text-[#bc002d]" /> More Stories
                </h3>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                {horizontalStrip.map((article) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                    <div className="relative aspect-[16/10] overflow-hidden mb-2 bg-gray-100">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 200px" />
                    </div>
                    <span className="text-[8px] font-black text-[#bc002d] uppercase tracking-[0.15em] block mb-0.5">{article.category?.categoryName}</span>
                    <h4 className="text-xs font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h4>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <section className="mt-14 md:mt-20 bg-[#111] text-white p-8 md:p-12 lg:p-14 relative overflow-hidden">
               <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-noto font-black uppercase tracking-[0.1em] flex items-center gap-3">
                     <TrendingUp size={22} className="text-[#bc002d]" />
                     Spotlight
                  </h3>
               </div>
               
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10">
                  {featuredArticles.map((article, i) => (
                     <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                        <div className="relative aspect-[16/10] overflow-hidden mb-4 bg-white/5">
                           <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                           <span className="absolute bottom-3 left-3 text-4xl font-noto font-black text-white/30 group-hover:text-[#bc002d] transition-colors">0{i + 1}</span>
                        </div>
                        <span className="text-[10px] text-[#bc002d] font-black uppercase mb-2 block tracking-[0.3em]">{article.category?.categoryName}</span>
                        <h4 className="text-base md:text-lg font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h4>
                     </Link>
                  ))}
               </div>
            </section>
          )}

          {/* Discover / Blog section */}
          {trendingProducts.length > 0 && (
            <section className="mt-10 pt-10 border-t border-gray-200">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  Discover <ChevronRight size={16} className="text-[#bc002d]" />
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {trendingProducts.map((article: any) => (
                     <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group border border-gray-100 p-3 hover:border-black transition-colors">
                        <div className="relative w-full aspect-video overflow-hidden mb-3 bg-gray-100">
                           <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                        </div>
                        <h4 className="text-sm font-bold leading-snug group-hover:text-[#bc002d] line-clamp-2 mb-1">{article.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Read article</span>
                     </Link>
                  ))}
               </div>
            </section>
          )}

          {/* Category Sections */}
          {categoryBlocks.length > 0 && (
            <div className="mt-14 space-y-14">
              {categoryBlocks.map((cat, ci) => (
                <section key={cat.name} className={ci % 2 === 0 ? "" : "bg-[#fafafa] -mx-4 sm:-mx-6 px-4 sm:px-6 py-10"}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-1 h-8 bg-[#bc002d]"></div>
                    <h3 className="text-xl md:text-2xl font-noto font-black uppercase tracking-wide">{cat.name}</h3>
                    <div className="h-[1px] flex-1 bg-gray-200"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cat.articles.length} Articles</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cat.articles.map((article: any, ai: number) => (
                      <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                        <div className="relative aspect-[16/10] overflow-hidden mb-3 bg-gray-100">
                          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 300px" />
                          {ai === 0 && (
                            <div className="absolute top-0 left-0 bg-[#bc002d] text-white text-[8px] font-black px-2.5 py-1 uppercase tracking-widest">Top</div>
                          )}
                        </div>
                        <span className="text-[9px] font-black text-[#bc002d] uppercase tracking-[0.15em] block mb-1">{cat.name}</span>
                        <h4 className="text-sm font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2 mb-1">{article.title}</h4>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

        </main>
    </div>
  );
}
