"use client";

import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { AdBanner } from "@/components/AdBanner";
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { Suspense, useState } from "react";
import { ClientPagination } from "@/components/home/ClientPagination";

interface Props {
   tenantId: string | null;
   articles: any[];
   banners: {
      top: any[];
      sidebar: any[];
      footer: any[];
   };
}

export default function JejuTimeLanding({ tenantId, articles, banners }: Props) {
   const heroArticles = articles.slice(0, 3);
   const mainArticle = heroArticles[0];
   const secondaryArticles = heroArticles.slice(1, 3);

   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(10);
   
   const totalPages = Math.ceil(articles.length / itemsPerPage) || 1;
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const latestStories = articles.slice(startIndex, endIndex);
   const trendingArticles = articles.slice(0, 5);
   const featuredArticles = articles.slice(0, 4);
   const trendingProducts = articles.filter((a: any) => a.status === "blog").slice(0, 4);

   return (
      <div className="bg-[#F8FAFC] text-[#2D3748] font-roboto selection:bg-blue-100">
         <LandingClientWrapper footerBanners={banners.footer} domain="jejutime.com">
            <div className="max-w-7xl mx-auto px-6 mt-4">
               <AdBanner position="HOME_TOP" initialBanners={banners.top} />
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">

               {/* Hero Section: Fixed Composition */}
               <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-24">

                  {/* Main Floating Feature */}
                  <div className="lg:col-span-8 group">
                     {mainArticle && (
                        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] group-hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] transition-all duration-700 hover:-translate-y-2 bg-slate-100 h-full">
                           <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="block h-full w-full relative">
                              <StoryImage
                                 src={mainArticle.imageUrl}
                                 alt={mainArticle.title}
                                 fill
                                 className="object-cover scale-105 transition-transform duration-1000"
                                 variant="hero"
                                 hideTitle={true}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent" />
                              <div className="absolute bottom-0 left-0 p-10 text-white max-w-2xl">
                                 <span className="inline-block bg-blue-500/30 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-4 border border-white/20">
                                    Primary Story
                                 </span>
                                 <h2 className="text-4xl font-playfair font-bold leading-tight mb-4 group-hover:text-blue-200 transition-colors">
                                    {mainArticle.title}
                                 </h2>
                                 <p className="text-white/80 line-clamp-2 text-lg font-light leading-relaxed">
                                    {mainArticle.content}
                                 </p>
                              </div>
                           </Link>
                        </div>
                     )}
                  </div>

                  {/* Secondary Stack (Fixed 2 articles) */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                     {secondaryArticles.map((article) => (
                        <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block flex-1">
                           <div className="relative h-full rounded-2xl overflow-hidden shadow-xl shadow-blue-100 group-hover:-translate-y-1 transition-all duration-500 bg-slate-100 border border-slate-100">
                              <StoryImage
                                 src={article.imageUrl}
                                 alt={article.title}
                                 fill className="object-cover"
                                 hideTitle={true}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent" />
                              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                                 <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-2 block">Deep Blue</span>
                                 <h3 className="text-lg font-bold leading-tight group-hover:text-blue-200 transition-colors line-clamp-2">
                                    {article.title}
                                 </h3>
                                 <div className="mt-3 flex items-center gap-2 opacity-60 text-[9px] font-bold uppercase tracking-tighter">
                                    <span>4 min read</span>
                                    <div className="w-1 h-1 rounded-full bg-white" />
                                    <span>{article.category?.categoryName || "Coastline"}</span>
                                 </div>
                              </div>
                           </div>
                        </Link>
                     ))}
                  </div>
               </section>

               {/* Main Content Grid (Latest + Sidebar) */}
               <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-24">
                  {/* Latest Stories (JejuTime UI) */}
                  <div className="lg:col-span-8">
                     <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                        <h3 className="text-3xl font-playfair font-black text-blue-950">Latest Updates</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {latestStories.map((article) => (
                           <article key={article.id} className="group cursor-pointer">
                              <Link href={`/article/${article.slug || article.id}`}>
                                 <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-xl shadow-blue-50 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-blue-200 bg-slate-100">
                                    <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
                                 </div>
                                 <h4 className="text-lg font-bold mb-2 leading-tight group-hover:text-blue-600 transition-colors">{article.title}</h4>
                                 <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-light">{article.content}</p>
                              </Link>
                           </article>
                        ))}
                     </div>
                     {articles.length > 0 && (
                        <ClientPagination
                           currentPage={currentPage}
                           totalPages={totalPages}
                           onPageChange={setCurrentPage}
                           itemsPerPage={itemsPerPage}
                           onItemsPerPageChange={setItemsPerPage}
                           totalItems={articles.length}
                           startIndex={startIndex}
                           endIndex={endIndex}
                           domain="jejutime.com"
                        />
                     )}
                  </div>

                  {/* Trending Sidebar (JejuTime UI) */}
                  <div className="lg:col-span-4">
                     <div className="bg-white rounded-3xl p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 mb-8">
                        <h3 className="text-xl font-playfair font-black text-blue-950 mb-6">Trending</h3>
                        <div className="space-y-6">
                           {trendingArticles.map((article, i) => (
                              <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 group">
                                 <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {i + 1}
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">{article.title}</h4>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </div>

                     <div className="sticky top-24">
                        <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
                     </div>
                  </div>
               </section>

               {/* Featured Articles */}
               {featuredArticles.length > 0 && (
                  <section className="mb-24">
                     <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                        <h3 className="text-2xl font-playfair font-black text-blue-950">Featured Collections</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {featuredArticles.map((article) => (
                           <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-slate-100">
                                 <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-2">{article.category?.categoryName}</span>
                              <h4 className="text-md font-bold leading-tight group-hover:text-blue-600 transition-colors">{article.title}</h4>
                           </Link>
                        ))}
                     </div>
                  </section>
               )}

               {/* Trending Products */}
               {trendingProducts.length > 0 && (
                  <section className="mb-12">
                     <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                        <h3 className="text-xl font-playfair font-black text-blue-950">Discover More</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trendingProducts.map((article: any) => (
                           <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                                 <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="text-sm font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">{article.title}</h4>
                              </div>
                           </Link>
                        ))}
                     </div>
                  </section>
               )}

            </main>
         </LandingClientWrapper>
      </div>
   );
}


