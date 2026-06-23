"use client";

import dynamic from "next/dynamic";
const AdBanner = dynamic(() => import("@/components/AdBanner").then(mod => mod.AdBanner), {
   ssr: true,
   loading: () => <div className="h-[120px] animate-pulse bg-slate-50 flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase tracking-widest border border-slate-100" />
});

const JejuTimeCategoryPreview = dynamic(() => import("./JejuTimeCategoryPreview"), {
   ssr: true,
   loading: () => <div className="h-64 animate-pulse bg-slate-50 w-full rounded-2xl" />
});
const JejuTimeTrendingProducts = dynamic(() => import("./JejuTimeTrendingProducts"), {
   ssr: false,
   loading: () => <div className="h-32 animate-pulse bg-slate-50 w-full rounded-2xl" />
});
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { useRef } from "react";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import type { Banner } from "@/components/AdBanner";
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

export default function JejuTimeLanding({ articles, banners }: Props) {
   // ── Deduplication Logic ──
   const sortedArticles = [...articles].sort((a, b) => {
      if (!!b.isHeadline !== !!a.isHeadline) return b.isHeadline ? 1 : -1;
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
         return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
   });

   // 1. Hero takes the first 3
   const heroArticles = sortedArticles.slice(0, 3);
   const heroIds = new Set(heroArticles.map(a => a.id));

   // 2. Trending takes the next 10
   const trendingArticles = sortedArticles.filter(a => !heroIds.has(a.id)).slice(0, 10);
   const trendingIds = new Set(trendingArticles.map(a => a.id));

   // 3. Sidebar Picks (Prominent cards below trending)
   const sidebarPicks = sortedArticles
      .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id))
      .slice(0, 5);
   const sidebarPicksIds = new Set(sidebarPicks.map(a => a.id));

   // 4. Featured takes the next 4
   const featuredArticles = sortedArticles
      .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id) && !sidebarPicksIds.has(a.id))
      .slice(0, 4);
   const featuredIds = new Set(featuredArticles.map(a => a.id));

   // 5. Sidebar Extra (Deep Dive) takes 4
   const sidebarExtra = sortedArticles
      .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id) && !sidebarPicksIds.has(a.id) && !featuredIds.has(a.id))
      .slice(0, 4);
   const sidebarExtraIds = new Set(sidebarExtra.map(a => a.id));

   // 6. Multimedia Carousel takes 6
   const carouselArticles = sortedArticles
      .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id) && !sidebarPicksIds.has(a.id) && !featuredIds.has(a.id) && !sidebarExtraIds.has(a.id))
      .slice(0, 6);
   const carouselIds = new Set(carouselArticles.map(a => a.id));

   // 7. Latest stories takes everything else
   const allLatestArticles = sortedArticles.filter(
      a => !heroIds.has(a.id) && !trendingIds.has(a.id) && !sidebarPicksIds.has(a.id) && !featuredIds.has(a.id) && !sidebarExtraIds.has(a.id) && !carouselIds.has(a.id)
   );


   // 1. Featured Cards (First 4)
   const latestFeatured = allLatestArticles.slice(0, 4);

   // 2. Chunks (Must be multiples of 8 to fill 2 columns perfectly)
   const remainingForChunks = allLatestArticles.slice(4);
   const numPairedArticles = Math.floor(remainingForChunks.length / 8) * 8;
   const chunkArticles = remainingForChunks.slice(0, numPairedArticles);

   const moreArticlesChunks = [];
   for (let i = 0; i < chunkArticles.length; i += 4) {
      moreArticlesChunks.push(chunkArticles.slice(i, i + 4));
   }

   // 3. List Rows (Everything else)
   const listRowArticles = remainingForChunks.slice(numPairedArticles);

   const trendingProducts = articles.filter((a) => a.status === "blog").slice(0, 4);

   const mainArticle = heroArticles[0];
   const secondaryArticles = heroArticles.slice(1, 3);

   // 8. Categories Preview
   const articlesByCategory: Record<string, Article[]> = {};
   sortedArticles.forEach(article => {
      const catName = article.category?.categoryName || "General";
      if (!articlesByCategory[catName]) articlesByCategory[catName] = [];
      articlesByCategory[catName].push(article);
   });

   const categoryKeys = Object.keys(articlesByCategory)
      .sort((a, b) => articlesByCategory[b].length - articlesByCategory[a].length)
      .slice(0, 8);
   
   const categoriesPreviewData = categoryKeys.map(cat => ({
      name: cat,
      articles: articlesByCategory[cat].slice(0, 3)
   }));

   const tenantConfig = ADSTERRA_CONFIG.jejutime;
   const adKeys = tenantConfig.banners;
   const showSkyscrapers = adKeys["160x600"] && adKeys["160x600"].length > 0;
   const midFeedConfig = tenantConfig.midFeed;

   const carouselRef = useRef<HTMLDivElement>(null);
   const scrollCarousel = (direction: "left" | "right") => {
      carouselRef.current?.scrollBy({ left: direction === "left" ? -220 : 220, behavior: "smooth" });
   };

   if (articles.length === 0) {
      return (
         <div className="min-h-[60vh] bg-[#F8FAFC] flex items-center justify-center px-4">
            <div className="text-center">
               <p className="text-xl font-bold text-[#2D3748] mb-2">No stories available yet.</p>
               <p className="text-sm text-slate-500 mt-1">Check back soon for the latest from JejuTime.</p>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-[#F8FAFC] text-[#2D3748] font-roboto selection:bg-blue-100 relative min-h-screen">
         {/* Floating Left Gutter Skyscraper */}
         {showSkyscrapers && (
            <div className="hidden min-[1650px]:block absolute right-[50%] mr-[660px] top-32 bottom-32 w-[160px] z-30">
               <div className="sticky top-40">
                  <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
               </div>
            </div>
         )}

         {/* Floating Right Gutter Skyscraper */}
         {showSkyscrapers && (
            <div className="hidden min-[1650px]:block absolute left-[50%] ml-[660px] top-32 bottom-32 w-[160px] z-30">
               <div className="sticky top-40">
                  <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
               </div>
            </div>
         )}

         <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
            <AdBanner position="HOME_TOP" initialBanners={banners.top} />
            {adKeys["728x90"] && (
               <div className="hidden sm:block">
                  <AdsterraBanner bannerKey={adKeys["728x90"]} width={728} height={90} />
               </div>
            )}
            {adKeys["320x50"] && (
               <div className="block sm:hidden">
                  <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} />
               </div>
            )}
         </div>

         <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

            {/* Hero Section: Fixed Composition */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-8">

               {/* Main Floating Feature */}
               <div className="lg:col-span-8 group">
                  {mainArticle && (
                     <div className="relative aspect-[4/5] sm:aspect-[16/9] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] group-hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1 bg-slate-100 h-full">
                        <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="block h-full w-full relative">
                           <StoryImage
                              src={mainArticle.imageUrl}
                              alt={mainArticle.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              variant="hero"
                              hideTitle={true}
                              priority={true}
                              sizes="(max-width: 640px) 450px, (max-width: 1024px) 100vw, 850px"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent" />
                           <div className="absolute bottom-0 left-0 p-6 sm:p-10 text-white w-full">
                              <span className="inline-block bg-blue-500/30 backdrop-blur-md px-3 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-3 sm:mb-4 border border-white/20">
                                 Primary Story
                              </span>
                              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-baskerville font-bold leading-tight mb-3 sm:mb-4 group-hover:text-blue-200 transition-colors">
                                 {mainArticle.title}
                              </h2>
                              <p className="text-white/80 line-clamp-2 text-sm sm:text-lg font-light leading-relaxed">
                                 {mainArticle.content ? mainArticle.content.replace(/<[^>]*>/g, "").slice(0, 200) : ""}
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
                        <div className="relative h-full overflow-hidden shadow-xl shadow-blue-100 group-hover:-translate-y-1 transition-all duration-300 bg-slate-100 border border-slate-100">
                           <StoryImage
                              src={article.imageUrl}
                              alt={article.title}
                              fill
                              className="object-cover"
                              hideTitle={true}
                              priority={true}
                              sizes="(max-width: 640px) 450px, (max-width: 1024px) 100vw, 400px"
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
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10">
               {/* Latest Stories (JejuTime UI) */}
               <div className="lg:col-span-8">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                     <h3 className="text-3xl font-baskerville font-black text-blue-950">Latest Updates</h3>
                  </div>

                  {/* Featured Cards (First 4) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     {latestFeatured.map((article) => (
                        <article key={article.id} className="group cursor-pointer">
                           <Link href={`/article/${article.slug || article.id}`}>
                              <div className="relative aspect-[16/10] overflow-hidden mb-5 shadow-xl shadow-blue-50 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-blue-100 bg-slate-100 border border-slate-100">
                                 <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                                 <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors pointer-events-none" />
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-3">{article.category?.categoryName || "Latest"}</span>
                              <h4 className="text-xl font-bold mb-3 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{article.title}</h4>
                              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-light">{article.content ? article.content.replace(/<[^>]*>/g, "") : ""}</p>
                           </Link>
                        </article>
                     ))}
                  </div>

                  {/* Multimedia Carousel */}
                  {carouselArticles.length > 0 && (
                     <div className="mb-8 pt-6 border-t-[3px] border-slate-900">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-sans">IN FOCUS</h3>
                           <div className="flex gap-2">
                              <button type="button" onClick={() => scrollCarousel("left")} className="w-8 h-8 flex items-center justify-center border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                              </button>
                              <button type="button" onClick={() => scrollCarousel("right")} className="w-8 h-8 flex items-center justify-center border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                              </button>
                           </div>
                        </div>
                        <div ref={carouselRef} className="flex gap-[2px] overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                           {carouselArticles.map((article) => (
                              <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block relative w-[180px] sm:w-[210px] shrink-0 snap-start">
                                 <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
                                    <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" sizes="200px" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                 </div>
                                 <div className="absolute bottom-0 left-0 w-full p-4">
                                    <h4 className="text-[15px] font-bold leading-snug text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-4">{article.title}</h4>
                                    {article.youtubeUrl ? (
                                       <div className="flex items-center gap-1.5 text-white/90 text-[13px] font-bold tracking-wider">
                                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                          <span>Watch</span>
                                       </div>
                                    ) : (
                                       <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{article.category?.categoryName || "Story"}</span>
                                    )}
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Dynamic More Articles Like Screenshot (Must be perfectly paired) */}
                  {moreArticlesChunks.length > 0 && (
                     <div className="mb-8 border-t border-slate-100 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                           {moreArticlesChunks.map((chunk, chunkIdx) => (
                              <div key={chunkIdx} className="flex flex-col">
                                 {chunk.map((article, i) => {
                                    if (i === 0) {
                                       return (
                                          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block mb-4">
                                             <div className="relative aspect-[16/10] overflow-hidden mb-3 bg-slate-100">
                                                <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 400px" />
                                             </div>
                                             <h4 className="text-xl sm:text-[22px] font-bold leading-tight group-hover:text-blue-600 transition-colors mb-2 text-black tracking-tight">{article.title}</h4>
                                             <p className="text-gray-800 text-sm sm:text-[15px] line-clamp-3 leading-relaxed font-serif">{article.content ? article.content.replace(/<[^>]*>/g, "") : ""}</p>
                                          </Link>
                                       );
                                    }
                                    if (i === 1 || i === 2) {
                                       return (
                                          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group flex gap-4 py-4 border-t border-gray-300">
                                             <div className="relative w-[100px] aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
                                                <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="100px" />
                                             </div>
                                             <h4 className="text-[16px] sm:text-[17px] font-bold leading-snug group-hover:text-blue-600 transition-colors text-black tracking-tight flex-1">{article.title}</h4>
                                          </Link>
                                       );
                                    }
                                    return (
                                       <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block py-4 border-t border-gray-300">
                                          <h4 className="text-[16px] sm:text-[17px] font-bold leading-snug group-hover:text-blue-600 transition-colors text-black tracking-tight">{article.title}</h4>
                                       </Link>
                                    );
                                 })}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Adsterra Mid-Feed Dynamic Ad */}
                  {midFeedConfig && (
                     <div className="flex justify-center my-10 py-6 border-y border-slate-100 bg-slate-50/30 w-full">
                        <AdsterraBanner bannerKey={midFeedConfig.key} width={midFeedConfig.width} height={midFeedConfig.height} className="!my-0" />
                     </div>
                  )}

                  {/* List Rows (Remaining Leftover articles that didn't fit into pairs) */}
                  {listRowArticles.length > 0 && (
                     <div className="space-y-6 border-t-2 border-slate-900 pt-6">
                        {listRowArticles.map((article) => (
                           <article key={article.id} className="group">
                              <Link href={`/article/${article.slug || article.id}`} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                 <div className="relative w-full sm:w-36 aspect-[16/10] sm:aspect-[4/3] overflow-hidden shrink-0 shadow-md shadow-blue-50 group-hover:shadow-blue-100 transition-all bg-slate-100 border border-slate-50">
                                    <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="150px" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                                       <span className="text-blue-600">{article.category?.categoryName || "General"}</span>
                                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                       <span>5 min read</span>
                                    </div>
                                    <h4 className="text-lg font-bold mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{article.title}</h4>
                                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed font-light">{article.content ? article.content.replace(/<[^>]*>/g, "") : ""}</p>
                                 </div>
                              </Link>
                           </article>
                        ))}
                     </div>
                  )}

                  {/* Category Preview Section */}
                  <JejuTimeCategoryPreview categories={categoriesPreviewData} />
               </div>

               {/* Trending & Picks Sidebar (JejuTime UI) */}
               <div className="lg:col-span-4">
                  {/* Added max-h and custom scrollbar styles so tall sidebars don't clip off the bottom */}
                  <div className="sticky top-24 space-y-8 pb-10">
                     {/* Trending */}
                     <div className="bg-white p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
                        <h3 className="text-xl font-baskerville font-black text-blue-950 mb-6">Trending</h3>
                        <div className="space-y-6">
                           {trendingArticles.map((article, i) => (
                              <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 group">
                                 <div className="w-8 h-8 bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {i + 1}
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">{article.title}</h4>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </div>

                     {/* Editors' Picks (Must Read) */}
                     <div className="bg-blue-950 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/20 border border-blue-900 relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-1000" />
                        <h3 className="text-xl font-baskerville font-black text-white mb-6 flex items-center gap-3">
                           <span className="w-6 h-[2px] bg-blue-400"></span>
                           Must Read
                        </h3>
                        <div className="flex flex-col gap-5 relative z-10">
                           {sidebarPicks.map((article) => (
                              <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group/item flex gap-4 items-center">
                                 <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10 group-hover/item:ring-blue-400 transition-colors bg-white/10">
                                    <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover/item:scale-110 transition-transform duration-500" sizes="64px" />
                                 </div>
                                 <div className="flex-1">
                                    <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest block mb-1">{article.category?.categoryName || "Top Pick"}</span>
                                    <h4 className="text-[14px] font-medium leading-snug group-hover/item:text-blue-200 transition-colors line-clamp-2 tracking-tight">{article.title}</h4>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </div>

                     {/* Deep Dive (Sidebar Extra) */}
                     <div className="bg-stone-50 p-6 sm:p-8 border-t-[3px] border-blue-600 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border-x border-b border-slate-100">
                        <h3 className="text-xl font-baskerville font-black text-slate-900 mb-6 flex items-center justify-between">
                           Deep Dive
                           <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-blue-600 bg-blue-100 px-2 py-1 rounded-sm">Special</span>
                        </h3>
                        <div className="flex flex-col gap-4">
                           {sidebarExtra.map((article, i) => {
                              if (i === 0) {
                                 return (
                                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block relative aspect-square w-full overflow-hidden mb-2 rounded-sm">
                                       <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="300px" />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                       <div className="absolute bottom-0 left-0 p-5">
                                          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block mb-2">{article.category?.categoryName || "Focus"}</span>
                                          <h4 className="text-[16px] sm:text-lg font-bold leading-tight text-white group-hover:text-blue-200 transition-colors">{article.title}</h4>
                                       </div>
                                    </Link>
                                 );
                              }
                              return (
                                 <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block py-2.5 border-l-2 border-blue-200 pl-4 hover:border-blue-600 transition-colors hover:bg-slate-100/50">
                                    <h4 className="text-[14px] font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 text-slate-800">{article.title}</h4>
                                 </Link>
                              );
                           })}
                        </div>
                     </div>

                     <AdBanner
                        position="HOME_SIDEBAR"
                        initialBanners={banners.sidebar}
                        className="!bg-white !shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] !p-4 !border-slate-100 !rounded-none"
                     />
                     <div className="bg-white p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
                        <AdsterraBanner bannerKey="9d6eb67243a0a0a49ad01beafe38cbef" width={300} height={250} />
                     </div>
                  </div>
               </div>
            </section>

            <JejuTimeTrendingProducts products={trendingProducts} />

            {/* Bottom Native Recommendations Widget */}
            <div className="mt-12 border-t border-slate-200 pt-8">
               <AdsterraNativeBanner domain="jejutime.com" />
            </div>

         </main>
      </div>
   );
}
