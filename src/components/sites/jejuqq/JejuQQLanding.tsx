"use client";

import { AdBanner } from "@/components/AdBanner";
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { ChevronRight, TrendingUp, ChevronLeft } from "lucide-react";
import { useState } from "react";
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

export default function JejuQQLanding({ tenantId, articles, banners }: Props) {
  const heroArticles = articles.slice(0, 5);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(articles.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const latestStories = articles.slice(startIndex, endIndex);
  const trendingArticles = [...articles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  const featuredArticles = articles.slice(0, 4);
  const trendingProducts = articles.filter((a: any) => a.status === "blog").slice(0, 4);

  const [[page, direction], setPage] = useState([0, 0]);
  const index = heroArticles.length > 0 ? Math.abs(page % heroArticles.length) : 0;
  const mainArticle = heroArticles[index];

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <div className="bg-[#fdf2f2] text-[#222] min-h-screen flex flex-col overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Main Article Section (Hero) - Full Width */}
        {mainArticle && (
          <div className="mb-10 md:mb-16 lg:mb-24 relative group">
            <div className="flex flex-col lg:flex-row-reverse gap-6 lg:gap-12 items-center">
              <div className="relative w-full lg:w-3/5 aspect-[16/9] overflow-hidden rounded-none bg-gray-100 shadow-lg group/image shrink-0 border-2 border-primary">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={page}
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
                      onClick={() => {
                        const newDirection = i > index ? 1 : -1;
                        setPage([i, newDirection]);
                      }}
                      className={`h-1.5 transition-all duration-300 rounded-none ${i === index ? "w-8 bg-primary" : "w-2 bg-white/60 hover:bg-white"}`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center py-2 min-w-0 w-full">
                <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-0.5 w-8 bg-primary"></span>
                    <span className="text-[11px] text-primary font-bold font-serif uppercase tracking-[0.3em]">{mainArticle.category?.categoryName}</span>
                  </div>
                  <h2 className="text-[26px] sm:text-[36px] md:text-[44px] lg:text-[52px] font-serif font-bold leading-[1.08] mb-4 group-hover:text-primary transition-colors tracking-tighter">
                    {mainArticle.title}
                  </h2>
                </Link>
                <p className="text-gray-600 text-base leading-relaxed mb-6 line-clamp-3 font-medium">
                  {mainArticle.content}
                </p>
                <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-black hover:text-[#dc2626] transition-colors">
                  Read Full Story <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Left Content Area (Latest Stories) */}
          <div className="lg:col-span-8">
            {/* Latest Stories Section */}
            <div className="pt-10 border-t border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl md:text-3xl font-serif font-bold uppercase tracking-tight">Latest Stories</h3>
                <div className="h-1 flex-1 mx-6 bg-gray-100 overflow-hidden">
                  <div className="h-full w-24 bg-primary"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {latestStories.map((article) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-row-reverse gap-5 group items-start">
                    <div className="relative w-28 sm:w-40 md:w-48 aspect-[4/3] shrink-0 rounded-none overflow-hidden border-2 border-[#dc2626]">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-primary font-bold font-serif uppercase mb-2 block tracking-[0.2em]">{article.category?.categoryName}</span>
                      <h5 className="text-[17px] sm:text-[20px] font-serif font-bold leading-tight group-hover:text-primary transition-colors mb-2">{article.title}</h5>
                      <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{article.content}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {articles.length > 0 && (
                <div className="mt-10">
                  <ClientPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={articles.length}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    domain="jejuqq.com"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar (Trending + Ad) */}
          <aside className="lg:col-span-4">
            <div className="bg-gray-50 rounded-none p-6 border-2 border-primary lg:sticky lg:top-32">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-200">
                <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                  Trending <TrendingUp size={20} className="text-primary" />
                </h3>
                <span className="w-2 h-2 rounded-none bg-primary"></span>
              </div>

              <div className="space-y-7">
                {trendingArticles.map((article, i) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 items-start group">
                    <span className="text-3xl font-serif font-bold text-primary/30 group-hover:text-primary/60 transition-colors tabular-nums shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold font-serif text-primary uppercase tracking-[0.2em] block mb-1">{article.category?.categoryName}</span>
                      <h4 className="text-[15px] font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-10 overflow-hidden">
                <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Sections */}
        <div className="mt-12 md:mt-20 space-y-12 md:space-y-20">
          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <section className="pt-10 border-t border-gray-200">
              <div className="flex items-center gap-5 mb-8">
                <h3 className="text-2xl md:text-3xl font-garamond font-bold uppercase tracking-tight whitespace-nowrap">Featured Report</h3>
                <div className="h-1 w-full bg-[#dc2626]/10 overflow-hidden">
                  <div className="h-full w-1/4 bg-[#dc2626]"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
                {featuredArticles.map((article) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-none mb-4 bg-gray-50 border-2 border-[#dc2626]">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                    </div>
                    <span className="text-[10px] text-[#dc2626] font-black uppercase mb-2 block tracking-widest">{article.category?.categoryName}</span>
                    <h4 className="text-base md:text-lg font-garamond font-bold leading-tight group-hover:text-[#dc2626] transition-colors">{article.title}</h4>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Trending Products / Blogs */}
          {trendingProducts.length > 0 && (
            <section className="bg-black rounded-none p-8 lg:p-16 text-white overflow-hidden relative">
              <h3 className="text-2xl md:text-3xl font-garamond font-bold mb-8 flex items-center gap-4 relative z-10">Explore More <span className="h-1 w-16 bg-[#dc2626]"></span></h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {trendingProducts.map((article: any) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group bg-white/5 border border-white/10 p-5 rounded-none hover:bg-[#dc2626] transition-colors">
                    <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-none">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-[15px] font-bold leading-tight line-clamp-2 mb-2">{article.title}</h4>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#dc2626] group-hover:text-white transition-colors">Discover</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
