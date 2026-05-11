"use client";

import dynamic from "next/dynamic";
const AdBanner = dynamic(() => import("@/components/AdBanner").then(mod => mod.AdBanner), { 
  ssr: true,
  loading: () => <div className="h-[120px] animate-pulse bg-gray-50 flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-widest" />
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

export default function JejuJapanLanding({ tenantId, articles, banners }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const sortedArticles = [...articles].sort((a, b) => {
    if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const heroArticles = articles.slice(0, 5);
  const heroIds = new Set(heroArticles.map(a => a.id));

  const allLatestArticles = sortedArticles.filter(a => !heroIds.has(a.id));
  
  const totalPages = Math.ceil(allLatestArticles.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const latestStories = allLatestArticles.slice(startIndex, endIndex);

  const trendingArticles = sortedArticles
    .filter(a => !heroIds.has(a.id))
    .slice(0, 10);
  const trendingIds = new Set(trendingArticles.map(a => a.id));

  const sidebarPicks = sortedArticles
    .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id))
    .slice(0, 5);

  const featuredArticles = articles.slice(0, 4);
  const trendingProducts = articles.filter((a: any) => a.status === "blog").slice(0, 4);

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
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Content Area */}
            <div className="lg:col-span-8">
              
              {/* Hero Section Carousel */}
              {heroArticle && (
                <div className="mb-6 md:mb-8">
                  <div className="relative aspect-video lg:aspect-[21/9] overflow-hidden mb-3 bg-gray-100 shadow-md">
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
                            sizes="(max-width: 1024px) 100vw, 850px"
                          />
                        </Link>
                      </motion.div>
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
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-noto font-black leading-[1.1] mb-4 hover:text-[#bc002d] transition-colors tracking-tight">
                      {heroArticle.title}
                    </h2>
                    <p className="text-gray-600 text-base lg:text-lg leading-relaxed line-clamp-3 font-light mb-5 opacity-90">
                      {heroArticle.content}
                    </p>
                    <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-[#bc002d] hover:text-black transition-colors">
                      Read Full Report <ChevronRight size={14} />
                    </span>
                  </Link>
                </div>
              )}

              {/* Latest Stories List */}
              <div className="space-y-4 border-t border-gray-100 pt-8">
                 {currentPage === 1 ? (
                    <>
                       {/* 1 Large Feature Card */}
                       {latestStories.length > 0 && (
                          <article className="mb-12 group">
                             <Link href={`/article/${latestStories[0].slug || latestStories[0].id}`} className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-center">
                                <div className="relative w-full lg:w-3/5 aspect-video overflow-hidden shadow-md bg-gray-100 shrink-0">
                                   <StoryImage src={latestStories[0].imageUrl} alt={latestStories[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 1024px) 100vw, 800px" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block px-3 py-1 bg-[#bc002d] text-white">Featured Latest</span>
                                   <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-4 group-hover:text-[#bc002d] transition-colors tracking-tight">
                                      {latestStories[0].title}
                                   </h3>
                                   <p className="text-gray-600 text-base lg:text-lg line-clamp-4 font-light leading-relaxed">
                                      {latestStories[0].content}
                                   </p>
                                </div>
                             </Link>
                          </article>
                       )}

                       {/* 3-Column Grid for next 6 items */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                          {latestStories.slice(1, 7).map((article) => (
                             <article key={article.id} className="group">
                                <Link href={`/article/${article.slug || article.id}`}>
                                   <div className="relative aspect-[16/10] overflow-hidden mb-3 bg-gray-100">
                                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 400px" />
                                   </div>
                                   <span className="text-[9px] font-black text-[#bc002d] uppercase tracking-[0.2em] mb-1 block">{article.category?.categoryName}</span>
                                   <h4 className="text-base font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h4>
                                </Link>
                             </article>
                          ))}
                       </div>

                       {/* Remaining rows */}
                       <div className="space-y-8">
                          {latestStories.slice(7).map((article) => (
                             <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-row gap-4 group items-start border-b border-gray-50 pb-6 last:border-0">
                                <div className="relative w-28 sm:w-40 md:w-56 aspect-[16/10] overflow-hidden shrink-0 bg-gray-100">
                                   <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="250px" />
                                </div>
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                   <span className="text-[10px] font-black text-[#bc002d] uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                      <span className="w-4 h-[1px] bg-[#bc002d]"></span>
                                      {article.category?.categoryName}
                                   </span>
                                   <h3 className="text-lg font-bold leading-tight mb-1 group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h3>
                                   <p className="text-sm text-gray-500 line-clamp-2 font-light leading-relaxed">{article.content}</p>
                                </div>
                             </Link>
                          ))}
                       </div>
                    </>
                 ) : (
                    /* Standard list for other pages */
                    <div className="space-y-8">
                       {latestStories.map((article) => (
                          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-row gap-4 group items-start border-b border-gray-50 pb-6 last:border-0">
                             <div className="relative w-28 sm:w-40 md:w-56 aspect-[16/10] overflow-hidden shrink-0 bg-gray-100">
                                <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="250px" />
                             </div>
                             <div className="flex flex-col justify-center flex-1 min-w-0">
                                <span className="text-[10px] font-black text-[#bc002d] uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                   <span className="w-4 h-[1px] bg-[#bc002d]"></span>
                                   {article.category?.categoryName}
                                </span>
                                <h3 className="text-lg font-bold leading-tight mb-1 group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 font-light leading-relaxed">{article.content}</p>
                             </div>
                          </Link>
                       ))}
                    </div>
                 )}
              </div>
              {articles.length > 0 && (
                 <div className="mt-4">
                    <ClientPagination
                       currentPage={currentPage}
                       totalPages={totalPages}
                       onPageChange={setCurrentPage}
                       itemsPerPage={itemsPerPage}
                       onItemsPerPageChange={setItemsPerPage}
                       totalItems={articles.length}
                       startIndex={startIndex}
                       endIndex={endIndex}
                       domain="jejujapan.com"
                    />
                 </div>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="lg:col-span-4">
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

          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <section className="mt-14 md:mt-20 bg-[#111] text-white p-8 md:p-12 lg:p-14 relative overflow-hidden">
               <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-noto font-black uppercase tracking-[0.1em] flex items-center gap-3">
                     <TrendingUp size={22} className="text-[#bc002d]" />
                     Featured Report
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

        </main>
    </div>
  );
}
