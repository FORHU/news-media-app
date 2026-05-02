"use client";

import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { AdBanner } from "@/components/AdBanner";
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { TrendingUp, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { Suspense, useState } from "react";
import { ClientPagination } from "@/components/home/ClientPagination";
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
  const heroArticles = articles.slice(0, 5);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const totalPages = Math.ceil(articles.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const latestStories = articles.slice(startIndex, endIndex);
  const trendingArticles = articles.slice(0, 5);
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
      <LandingClientWrapper footerBanners={banners.footer} domain="jejujapan.com">
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <AdBanner position="HOME_TOP" initialBanners={banners.top} />
        </div>

        <main className="max-w-7xl mx-auto px-6 py-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Content Area */}
            <div className="lg:col-span-8">
              
              {/* Hero Section Carousel */}
              {heroArticle && (
                <div className="mb-12 group relative">
                  <div className="relative aspect-[21/9] overflow-hidden mb-6 bg-gray-100">
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
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            variant="hero"
                          />
                        </Link>
                      </motion.div>
                    </AnimatePresence>

                    <div className="absolute top-4 left-4 bg-[#bc002d] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest z-10">
                       Top Story
                    </div>

                    <button type="button" onClick={() => paginate(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white text-[#bc002d] flex items-center justify-center shadow-lg transition-colors" aria-label="Previous">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => paginate(1)} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white text-[#bc002d] flex items-center justify-center shadow-lg transition-colors" aria-label="Next">
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
                          className={`h-1.5 transition-all duration-300 ${i === index ? "w-8 bg-[#bc002d]" : "w-4 bg-white/50 hover:bg-white/80"}`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Link href={`/article/${heroArticle.slug || heroArticle.id}`}>
                    <h2 className="text-4xl font-serif font-black leading-tight mb-4 hover:text-[#bc002d] transition-colors">
                      {heroArticle.title}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed line-clamp-3 font-light">
                      {heroArticle.content}
                    </p>
                  </Link>
                </div>
              )}

              {/* Latest Stories List (JejuJapan UI) */}
              <div className="space-y-8 border-t border-gray-100 pt-8 mt-12">
                 {latestStories.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-col md:flex-row gap-8 group">
                       <div className="relative w-full md:w-60 aspect-[16/10] overflow-hidden shrink-0 bg-gray-100">
                          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                       </div>
                       <div className="flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-[#bc002d] uppercase tracking-widest mb-2">{article.category?.categoryName}</span>
                          <h3 className="text-xl font-bold leading-tight mb-3 group-hover:text-[#bc002d] transition-colors">{article.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 font-light mb-3">{article.content}</p>
                          <div className="flex items-center text-[10px] text-gray-400 font-bold gap-4 uppercase mt-auto">
                             <span className="flex items-center gap-1"><Clock size={10} /> 2 hours ago</span>
                             <span>By Bureau Tokyo</span>
                          </div>
                       </div>
                    </Link>
                 ))}
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

            {/* Right Sidebar (Trending & Precision) */}
            <aside className="lg:col-span-4">
               <div className="bg-[#111] text-white p-8 mb-8">
                  <h3 className="text-lg font-serif font-black flex items-center gap-2 mb-8 uppercase tracking-widest border-b border-white/20 pb-4">
                     <TrendingUp size={20} className="text-[#bc002d]" /> Trending
                  </h3>
                  <div className="space-y-8">
                     {trendingArticles.map((article, i) => (
                        <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                           <div className="flex gap-4">
                              <span className="text-3xl font-serif font-black text-white/20 group-hover:text-[#bc002d] transition-colors">0{i + 1}</span>
                              <div>
                                 <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">{article.category?.categoryName}</span>
                                 <h4 className="text-sm font-bold leading-snug group-hover:text-white/80 line-clamp-2">{article.title}</h4>
                              </div>
                           </div>
                        </Link>
                     ))}
                  </div>
               </div>

               <div className="sticky top-24">
                  <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
               </div>
            </aside>

          </div>

          {/* Bottom Grid: Featured Articles */}
          {featuredArticles.length > 0 && (
            <section className="mt-24 border-t-4 border-black pt-12">
               <div className="flex items-center justify-between mb-12">
                  <h3 className="text-2xl font-serif font-black uppercase tracking-widest">Featured Report</h3>
                  <Link href="#" className="text-xs font-bold flex items-center gap-1 hover:text-[#bc002d]">View All <ChevronRight size={14}/></Link>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {featuredArticles.map((article) => (
                     <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group">
                        <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-gray-100">
                           <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <span className="text-[10px] text-[#bc002d] font-bold uppercase mb-2 block tracking-widest">{article.category?.categoryName}</span>
                        <h4 className="text-lg font-bold leading-tight group-hover:text-[#bc002d] transition-colors">{article.title}</h4>
                     </Link>
                  ))}
               </div>
            </section>
          )}

          {/* Bottom Grid: Trending Products / Blogs */}
          {trendingProducts.length > 0 && (
            <section className="mt-16 pt-12 border-t border-gray-200">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                  Discover <ChevronRight size={16} className="text-[#bc002d]" />
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {trendingProducts.map((article: any) => (
                     <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group border border-gray-100 p-4 hover:border-black transition-colors">
                        <div className="relative w-full aspect-video overflow-hidden mb-4 bg-gray-100">
                           <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                        </div>
                        <h4 className="text-sm font-bold leading-snug group-hover:text-[#bc002d] line-clamp-2 mb-2">{article.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Read article</span>
                     </Link>
                  ))}
               </div>
            </section>
          )}

        </main>
      </LandingClientWrapper>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Playfair+Display:wght@900&display=swap');
        
        body {
          font-family: 'Noto Sans JP', sans-serif;
        }
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
      `}} />
    </div>
  );
}
