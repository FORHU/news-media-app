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
    <div className="bg-white text-black font-inter selection:bg-black selection:text-white">
      {/* Top Banner */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 mt-6">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
      </div>

      <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Left Sidebar — Ultra Minimalist */}
            <aside className="hidden lg:block lg:col-span-2">
              <div className="sticky top-32">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 flex items-center gap-3 text-black">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" /> Latest
                </h3>
                <div className="space-y-12">
                  {leftSidebarArticles.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                      <div className="relative aspect-[4/3] overflow-hidden mb-4 bg-gray-50 border border-gray-100/50">
                        <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="200px" />
                      </div>
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em] block mb-2">{article.category?.categoryName}</span>
                      <h4 className="text-[14px] font-normal font-voltaire leading-tight group-hover:text-black group-hover:underline transition-all line-clamp-2">{article.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* Center Content Area */}
            <div className="lg:col-span-7">
              
              {/* Hero Section Carousel */}
              {heroArticle && (
                <div className="mb-20">
                  <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden mb-10 bg-gray-50 group border-b-4 border-black">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                      <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "spring", stiffness: 200, damping: 25 }, opacity: { duration: 0.3 } }}
                        className="h-full w-full absolute inset-0"
                      >
                        <Link href={`/article/${heroArticle.slug || heroArticle.id}`} className="block h-full">
                          <StoryImage 
                            src={heroArticle.imageUrl} 
                            alt={heroArticle.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-all duration-1000"
                            variant="hero"
                            priority={true}
                            sizes="(max-width: 1024px) 100vw, 1000px"
                          />
                        </Link>
                      </motion.div>
                    </AnimatePresence>

                    <div className="absolute top-8 left-8 bg-black text-white text-[11px] font-black px-6 py-2.5 uppercase tracking-[0.4em] z-10">
                       Top Stories
                    </div>

                    <div className="absolute inset-y-0 left-0 flex items-center z-10">
                       <button type="button" onClick={() => paginate(-1)} className="ml-6 w-12 h-12 bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110" aria-label="Previous">
                         <ChevronLeft className="w-6 h-6" />
                       </button>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center z-10">
                       <button type="button" onClick={() => paginate(1)} className="mr-6 w-12 h-12 bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110" aria-label="Next">
                         <ChevronRight className="w-6 h-6" />
                       </button>
                    </div>
                  </div>

                  <Link href={`/article/${heroArticle.slug || heroArticle.id}`} className="block group">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-voltaire font-normal leading-[0.95] mb-8 group-hover:underline underline-offset-[12px] decoration-1 transition-all tracking-tighter">
                      {heroArticle.title}
                    </h2>
                    <p className="text-gray-800 text-lg lg:text-xl leading-relaxed line-clamp-3 font-medium mb-10 opacity-95 max-w-4xl border-l-2 border-gray-200 pl-8">
                      {heroArticle.content}
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.5em] text-black border-2 border-black px-6 py-2.5 hover:bg-black hover:text-white transition-all">
                          Read Report
                        </span>
                        <div className="h-[1px] flex-1 bg-gray-100" />
                    </div>
                  </Link>
                </div>
              )}

              {/* Latest Stories List */}
              <div className="space-y-24 border-t border-gray-100 pt-20">
                 {currentPage === 1 ? (
                    <>
                       {/* High Impact Feature Card */}
                       {latestStories.length > 0 && (
                          <article className="mb-20 group">
                             <Link href={`/article/${latestStories[0].slug || latestStories[0].id}`} className="flex flex-col gap-10">
                                <div className="relative w-full aspect-[21/9] overflow-hidden bg-gray-50">
                                   <StoryImage src={latestStories[0].imageUrl} alt={latestStories[0].title} fill className="object-cover group-hover:scale-105 transition-all duration-1000" sizes="(max-width: 1024px) 100vw, 900px" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 inline-block text-black border-b border-black pb-1">Primary Feed</span>
                                   <h3 className="text-3xl sm:text-4xl lg:text-5xl font-voltaire font-normal leading-tight mb-6 group-hover:underline transition-all tracking-tight">
                                      {latestStories[0].title}
                                   </h3>
                                   <p className="text-gray-700 text-lg line-clamp-3 font-medium leading-relaxed max-w-3xl">
                                      {latestStories[0].content}
                                   </p>
                                </div>
                             </Link>
                          </article>
                       )}

                       {/* 3-Column Magazine Grid */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 mb-20">
                          {latestStories.slice(1, 10).map((article) => (
                             <article key={article.id} className="group">
                                <Link href={`/article/${article.slug || article.id}`}>
                                   <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-gray-50">
                                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-all duration-700" sizes="300px" />
                                   </div>
                                   <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] mb-3 block">{article.category?.categoryName}</span>
                                   <h4 className="text-[18px] font-normal font-voltaire leading-[1.2] group-hover:text-black group-hover:underline transition-all line-clamp-3">{article.title}</h4>
                                </Link>
                             </article>
                          ))}
                       </div>

                       {/* Remaining rows — List view */}
                       <div className="space-y-12">
                          {latestStories.slice(10).map((article) => (
                             <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-row gap-8 group items-start border-b border-gray-100 pb-12 last:border-0">
                                <div className="relative w-32 sm:w-48 lg:w-56 aspect-[3/4] overflow-hidden shrink-0 bg-gray-50">
                                   <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-all duration-500" sizes="300px" />
                                </div>
                                <div className="flex flex-col justify-center flex-1 min-w-0 pt-2">
                                   <span className="text-[10px] font-black text-black uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                      <div className="w-6 h-[1px] bg-black"></div>
                                      {article.category?.categoryName}
                                   </span>
                                   <h3 className="text-2xl font-normal font-voltaire leading-tight mb-4 group-hover:underline transition-all line-clamp-2">{article.title}</h3>
                                   <p className="text-gray-700 text-base line-clamp-2 font-medium leading-relaxed max-w-2xl">{article.content}</p>
                                </div>
                             </Link>
                          ))}
                       </div>
                    </>
                 ) : (
                    /* Standard list for other pages */
                    <div className="space-y-12">
                       {latestStories.map((article) => (
                          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-row gap-8 group items-start border-b border-gray-100 pb-12 last:border-0">
                             <div className="relative w-32 sm:w-48 lg:w-56 aspect-[3/4] overflow-hidden shrink-0 bg-gray-50">
                                <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="300px" />
                             </div>
                             <div className="flex flex-col justify-center flex-1 min-w-0 pt-2">
                                <span className="text-[10px] font-black text-black uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                   <div className="w-6 h-[1px] bg-black"></div>
                                   {article.category?.categoryName}
                                </span>
                                <h3 className="text-2xl font-normal font-voltaire leading-tight mb-4 group-hover:underline transition-all line-clamp-2">{article.title}</h3>
                                <p className="text-gray-700 text-base line-clamp-2 font-medium leading-relaxed max-w-2xl">{article.content}</p>
                             </div>
                          </Link>
                       ))}
                    </div>
                 )}
              </div>

              {articles.length > 0 && (
                 <div className="mt-20 border-t border-black pt-10">
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

            {/* Right Sidebar — High Contrast */}
            <aside className="lg:col-span-3">
               <div className="border-t-4 border-black pt-10 mb-16">
                  <h3 className="text-[12px] font-black flex items-center gap-4 mb-10 uppercase tracking-[0.5em] text-black">
                     <TrendingUp size={18} /> Popular
                  </h3>
                   <div className="space-y-10">
                       {trendingArticles.map((article, i) => (
                          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                             <div className="flex gap-6">
                                <span className="text-5xl font-voltaire font-normal text-gray-400 group-hover:text-black transition-colors shrink-0 leading-none">
                                   {(i + 1)}
                                </span>
                                <div className="min-w-0 pt-1">
                                   <span className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-2">{article.category?.categoryName}</span>
                                   <h4 className="text-[15px] font-normal font-voltaire leading-snug group-hover:underline line-clamp-2 transition-all">{article.title}</h4>
                                </div>
                             </div>
                          </Link>
                       ))}
                    </div>
                 </div>

                {/* Must Read Section */}
                {sidebarPicks.length > 0 && (
                   <div className="mb-16">
                      <h3 className="text-[12px] font-black flex items-center gap-4 mb-10 uppercase tracking-[0.5em] text-black">
                         In Depth <div className="w-1.5 h-1.5 bg-black" />
                      </h3>
                      <div className="space-y-12">
                         {sidebarPicks.map((article) => (
                            <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                               <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 mb-6 border border-gray-100/50">
                                  <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-all duration-700" />
                               </div>
                               <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] block mb-2">{article.category?.categoryName}</span>
                               <h4 className="text-[18px] font-normal font-voltaire leading-tight group-hover:underline transition-all line-clamp-2">{article.title}</h4>
                            </Link>
                         ))}
                      </div>
                   </div>
                )}

               <div className="lg:sticky lg:top-32">
                  <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
               </div>
            </aside>

          </div>

          {/* Horizontal Strip — Grid Minimalist */}
          {horizontalStrip.length > 0 && (
            <section className="mt-32 pt-20 border-t border-black">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] flex items-center gap-4 text-black">
                  More From VoiceJeju
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-12">
                {horizontalStrip.map((article) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden mb-5 bg-gray-50">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-all duration-700" sizes="250px" />
                    </div>
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em] block mb-2">{article.category?.categoryName}</span>
                    <h4 className="text-[15px] font-normal font-voltaire leading-tight group-hover:underline transition-all line-clamp-2">{article.title}</h4>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Discover / Blog section */}
          {trendingProducts.length > 0 && (
            <section className="mt-32 pt-24 border-t-8 border-black">
               <h3 className="text-[14px] font-black uppercase tracking-[0.6em] mb-12 text-center text-black">
                  VoiceJeju Journal
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
                  {trendingProducts.map((article: any) => (
                     <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group border-l border-gray-100 pl-6 hover:border-black transition-all">
                        <div className="relative w-full aspect-video overflow-hidden mb-6 bg-gray-50">
                           <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-all duration-700" />
                        </div>
                        <h4 className="text-[18px] font-normal font-voltaire leading-snug group-hover:underline line-clamp-2 mb-3 transition-all">{article.title}</h4>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] group-hover:text-black transition-colors">Read Story</span>
                     </Link>
                  ))}
               </div>
            </section>
          )}

        </main>
    </div>
  );
}
