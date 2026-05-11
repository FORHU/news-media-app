"use client"; // VoiceJeju Landing Component

import dynamic from "next/dynamic";
const AdBanner = dynamic(() => import("@/components/AdBanner").then(mod => mod.AdBanner), { 
  ssr: true,
  loading: () => <div className="h-[120px] animate-pulse bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase tracking-widest" />
});
const ClientPagination = dynamic(() => import("@/components/home/ClientPagination").then(mod => mod.ClientPagination), { 
  ssr: true,
  loading: () => <div className="h-20 animate-pulse bg-gray-50 w-full" />
});
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { TrendingUp, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  tenantId: string | null;
  articles: any[];
  banners: {
    top: any[];
    sidebar: any[];
    footer: any[];
  };
}

export function VoiceJejuLanding({ tenantId, articles, banners }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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
    const remaining = count - unique.length;
    return [...unique, ...pool.filter(a => excludeIds.has(a.id)).slice(0, remaining)];
  };

  // Track used IDs as we go
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

  // Center — Latest Stories (paginated)
  const uniqueLatest = pool.filter(a => !usedIds.has(a.id));
  const allLatestArticles = uniqueLatest.length > 0 ? uniqueLatest : pool;
  const totalPages = Math.ceil(allLatestArticles.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const latestStories = allLatestArticles.slice(startIndex, endIndex);
  latestStories.forEach(a => usedIds.add(a.id));

  // Horizontal strip
  const horizontalStrip = pickArticles(5, usedIds);
  horizontalStrip.forEach(a => usedIds.add(a.id));

  // Bottom — Featured Report
  const featuredArticles = pickArticles(4, usedIds);

  // Bottom — Discover / Blog
  const trendingProducts = articles
    .filter((a: any) => a.status === "blog")
    .slice(0, 4);

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
    <div className="bg-white text-black font-inter">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 mt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
      </div>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Sidebar — Latest Minimalist */}
            <aside className="hidden lg:block lg:col-span-2">
              <div className="sticky top-28">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                  <Clock size={14} className="text-[#e60000]" /> Latest
                </h3>
                <div className="space-y-6">
                  {leftSidebarArticles.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                      <div className="relative aspect-[4/3] overflow-hidden mb-2 bg-gray-50 border border-gray-100">
                        <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="180px" />
                      </div>
                      <span className="text-[9px] font-black text-[#e60000] uppercase tracking-[0.2em] block mb-1">{article.category?.categoryName}</span>
                      <h4 className="text-[12px] font-bold font-inter leading-tight group-hover:text-[#e60000] transition-colors line-clamp-2">{article.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* Center Content Area */}
            <div className="lg:col-span-7">
              
              {/* Hero Section Carousel */}
              {heroArticle && (
                <div className="mb-12">
                  <div className="relative aspect-video lg:aspect-[16/8] overflow-hidden mb-6 bg-gray-50 shadow-sm border border-gray-100">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                      <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
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
                            sizes="(max-width: 1024px) 100vw, 900px"
                          />
                        </Link>
                      </motion.div>
                    </AnimatePresence>

                    <div className="absolute top-6 left-6 bg-black text-white text-[10px] font-black px-5 py-2 uppercase tracking-[0.3em] z-10 shadow-lg">
                       Top Story
                    </div>

                    <div className="absolute inset-y-0 left-0 flex items-center z-10">
                       <button type="button" onClick={() => paginate(-1)} className="ml-4 w-10 h-10 bg-white/95 hover:bg-white text-black flex items-center justify-center shadow-xl transition-all hover:scale-110" aria-label="Previous">
                         <ChevronLeft className="w-6 h-6" />
                       </button>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center z-10">
                       <button type="button" onClick={() => paginate(1)} className="mr-4 w-10 h-10 bg-white/95 hover:bg-white text-black flex items-center justify-center shadow-xl transition-all hover:scale-110" aria-label="Next">
                         <ChevronRight className="w-6 h-6" />
                       </button>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-10">
                      {heroArticles.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            const newDirection = i > index ? 1 : -1;
                            setPage([i, newDirection]);
                          }}
                          className={`h-1 transition-all duration-500 ${i === index ? "w-12 bg-white" : "w-4 bg-white/40 hover:bg-white/80"}`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Link href={`/article/${heroArticle.slug || heroArticle.id}`} className="block">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-voltaire font-normal leading-[1.05] mb-6 hover:text-gray-700 transition-colors tracking-tight">
                      {heroArticle.title}
                    </h2>
                    <p className="text-gray-600 text-base lg:text-lg leading-relaxed line-clamp-3 font-medium mb-8 opacity-90 max-w-4xl">
                      {heroArticle.content}
                    </p>
                    <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.4em] text-[#e60000] hover:text-black transition-colors border-b border-transparent hover:border-black pb-1">
                      Read Full Report <ChevronRight size={14} />
                    </span>
                  </Link>
                </div>
              )}

              {/* Latest Stories List */}
              <div className="space-y-12 border-t border-gray-100 pt-12">
                 {currentPage === 1 ? (
                    <>
                       {/* 1 Premium Feature Card */}
                       {latestStories.length > 0 && (
                          <article className="mb-12 group">
                             <Link href={`/article/${latestStories[0].slug || latestStories[0].id}`} className="flex flex-col gap-6">
                                <div className="relative w-full aspect-[21/9] overflow-hidden shadow-sm bg-gray-50 border border-gray-100">
                                   <StoryImage src={latestStories[0].imageUrl} alt={latestStories[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 1024px) 100vw, 850px" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 inline-block px-4 py-1.5 bg-black text-white">Featured Latest</span>
                                   <h3 className="text-2xl sm:text-3xl lg:text-4xl font-voltaire font-normal leading-tight mb-4 group-hover:text-gray-700 transition-colors tracking-tight">
                                      {latestStories[0].title}
                                   </h3>
                                   <p className="text-gray-600 text-base lg:text-lg line-clamp-3 font-medium leading-relaxed max-w-3xl">
                                      {latestStories[0].content}
                                   </p>
                                </div>
                             </Link>
                          </article>
                       )}

                       {/* 3-Column Grid */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mb-12">
                          {latestStories.slice(1, 10).map((article) => (
                             <article key={article.id} className="group">
                                <Link href={`/article/${article.slug || article.id}`}>
                                   <div className="relative aspect-[4/3] overflow-hidden mb-4 bg-gray-50 border border-gray-100">
                                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 300px" />
                                   </div>
                                   <span className="text-[10px] font-black text-[#e60000] uppercase tracking-[0.25em] mb-2 block">{article.category?.categoryName}</span>
                                   <h4 className="text-[15px] font-bold font-inter leading-tight group-hover:text-[#e60000] transition-colors line-clamp-2">{article.title}</h4>
                                </Link>
                             </article>
                          ))}
                       </div>

                       {/* Remaining rows — compact horizontal cards */}
                       <div className="space-y-6">
                          {latestStories.slice(10).map((article) => (
                             <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-row gap-6 group items-start border-b border-gray-100 pb-6 last:border-0">
                                <div className="relative w-28 sm:w-40 lg:w-48 aspect-[4/3] overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
                                   <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="250px" />
                                </div>
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                   <span className="text-[9px] font-black text-[#e60000] uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                      <span className="w-4 h-[1px] bg-[#e60000]"></span>
                                      {article.category?.categoryName}
                                   </span>
                                   <h3 className="text-lg font-bold font-inter leading-tight mb-2 group-hover:text-[#e60000] transition-colors line-clamp-2">{article.title}</h3>
                                   <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-relaxed">{article.content}</p>
                                </div>
                             </Link>
                          ))}
                       </div>
                    </>
                 ) : (
                    /* Standard list for other pages */
                    <div className="space-y-6">
                       {latestStories.map((article) => (
                          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-row gap-6 group items-start border-b border-gray-100 pb-6 last:border-0">
                             <div className="relative w-28 sm:w-40 lg:w-48 aspect-[4/3] overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
                                <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="250px" />
                             </div>
                             <div className="flex flex-col justify-center flex-1 min-w-0">
                                <span className="text-[9px] font-black text-[#e60000] uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                   <span className="w-4 h-[1px] bg-[#e60000]"></span>
                                   {article.category?.categoryName}
                                </span>
                                <h3 className="text-lg font-bold font-inter leading-tight mb-2 group-hover:text-[#e60000] transition-colors line-clamp-2">{article.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-relaxed">{article.content}</p>
                             </div>
                          </Link>
                       ))}
                    </div>
                 )}
              </div>
              {articles.length > 0 && (
                 <div className="mt-12">
                    <ClientPagination
                       currentPage={currentPage}
                       totalPages={totalPages}
                       onPageChange={setCurrentPage}
                       itemsPerPage={itemsPerPage}
                       onItemsPerPageChange={setItemsPerPage}
                       totalItems={articles.length}
                       startIndex={startIndex}
                       endIndex={endIndex}
                       domain="voicejeju.com"
                    />
                 </div>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="lg:col-span-3">
               <div className="bg-black text-white p-8 mb-8">
                  <h3 className="text-[11px] font-black flex items-center gap-3 mb-8 uppercase tracking-[0.4em] border-b border-white/10 pb-5">
                     <TrendingUp size={18} className="text-[#e60000]" /> Trending
                  </h3>
                   <div className="space-y-8">
                       {trendingArticles.map((article, i) => (
                          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                             <div className="flex gap-5">
                                <span className="text-4xl font-voltaire font-normal text-white/20 group-hover:text-[#e60000] transition-colors shrink-0 leading-none">
                                   {String(i + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0">
                                   <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] block mb-2">{article.category?.categoryName}</span>
                                   <h4 className="text-sm font-bold font-inter leading-snug group-hover:text-white/80 line-clamp-2 transition-colors">{article.title}</h4>
                                </div>
                             </div>
                          </Link>
                       ))}
                    </div>
                 </div>

                {/* Must Read Section */}
                {sidebarPicks.length > 0 && (
                   <div className="bg-white p-8 border border-gray-100 mb-8 shadow-sm">
                      <h3 className="text-[11px] font-black flex items-center gap-3 mb-8 uppercase tracking-[0.4em] border-b border-gray-100 pb-5 text-gray-900">
                         Must Read <div className="w-2 h-2 bg-[#e60000]" />
                      </h3>
                      <div className="space-y-8">
                         {sidebarPicks.map((article) => (
                            <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                               <div className="relative aspect-video overflow-hidden bg-gray-50 mb-4 border border-gray-100">
                                  <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                               </div>
                               <span className="text-[10px] font-black text-[#e60000] uppercase tracking-[0.2em] block mb-2">{article.category?.categoryName}</span>
                               <h4 className="text-[15px] font-bold font-inter leading-tight group-hover:text-[#e60000] transition-colors line-clamp-2">{article.title}</h4>
                            </Link>
                         ))}
                      </div>
                   </div>
                )}

               <div className="lg:sticky lg:top-28">
                  <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
               </div>
            </aside>

          </div>

          {/* Horizontal Article Strip */}
          {horizontalStrip.length > 0 && (
            <section className="mt-16 pt-12 border-t border-gray-100">
              <div className="flex items-center gap-6 mb-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap flex items-center gap-3 text-gray-900">
                  <ChevronRight size={18} className="text-[#e60000]" /> More Stories
                </h3>
                <div className="h-[1px] flex-1 bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
                {horizontalStrip.map((article) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden mb-3 bg-gray-50 border border-gray-100">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 200px" />
                    </div>
                    <span className="text-[9px] font-black text-[#e60000] uppercase tracking-[0.25em] block mb-1">{article.category?.categoryName}</span>
                    <h4 className="text-xs font-bold font-inter leading-tight group-hover:text-[#e60000] transition-colors line-clamp-2">{article.title}</h4>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Featured Articles Section: Dark Premium */}
          {featuredArticles.length > 0 && (
            <section className="mt-24 bg-black text-white p-10 md:p-16 lg:p-20 relative overflow-hidden">
               <div className="flex items-center justify-between mb-12 relative z-10 border-b border-white/10 pb-8">
                  <h3 className="text-2xl sm:text-3xl font-voltaire font-normal uppercase tracking-[0.15em] flex items-center gap-4">
                     <TrendingUp size={28} className="text-[#e60000]" />
                     Featured Report
                  </h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 relative z-10">
                  {featuredArticles.map((article, i) => (
                     <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                        <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-white/5 border border-white/10">
                           <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                           <span className="absolute bottom-4 left-4 text-5xl font-voltaire font-normal text-white/20 group-hover:text-[#e60000] transition-colors leading-none">0{i + 1}</span>
                        </div>
                        <span className="text-[10px] text-[#e60000] font-black uppercase mb-3 block tracking-[0.4em]">{article.category?.categoryName}</span>
                        <h4 className="text-lg md:text-xl font-voltaire font-normal leading-tight group-hover:text-[#e60000] transition-colors line-clamp-2">{article.title}</h4>
                     </Link>
                  ))}
               </div>
            </section>
          )}

          {/* Discover / Blog section */}
          {trendingProducts.length > 0 && (
            <section className="mt-20 pt-16 border-t border-gray-100">
               <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 text-gray-900">
                  Discover <ChevronRight size={18} className="text-[#e60000]" />
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {trendingProducts.map((article: any) => (
                     <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group border border-gray-100 p-4 hover:border-black transition-all hover:shadow-xl">
                        <div className="relative w-full aspect-video overflow-hidden mb-4 bg-gray-50">
                           <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h4 className="text-[15px] font-bold font-inter leading-snug group-hover:text-[#e60000] line-clamp-2 mb-2 transition-colors">{article.title}</h4>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Read Story</span>
                     </Link>
                  ))}
               </div>
            </section>
          )}

        </main>
    </div>
  );
}
