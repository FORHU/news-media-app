"use client";

import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { AdBanner } from "@/components/AdBanner";
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";

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
  const mainArticle = articles[0];
  const galleryArticles = articles.slice(1, 4);
  const latestStories = articles.slice(4, 14); // Replaces Insights & Opinions
  const trendingArticles = articles.slice(0, 5); // Sidebar
  const featuredArticles = articles.slice(14, 18); // Bottom grid
  const trendingProducts = articles.filter((a: any) => a.status === "blog").slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-[#222]">
      <LandingClientWrapper footerBanners={banners.footer}>
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <AdBanner position="HOME_TOP" initialBanners={banners.top} />
        </div>

        <main className="max-w-7xl mx-auto px-4 py-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Content Area (Hero + Latest) */}
            <div className="lg:col-span-8">
              {/* Main Article Section (Hero) */}
              {mainArticle && (
                <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-100">
                            <StoryImage 
                                src={mainArticle.imageUrl} 
                                alt={mainArticle.title}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-700"
                                variant="hero"
                            />
                        </Link>
                        <div>
                            <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="group">
                                <h2 className="text-[34px] font-serif font-bold leading-tight mb-4 group-hover:underline decoration-[#ff4500]">
                                    {mainArticle.title}
                                </h2>
                            </Link>
                            <p className="text-gray-600 leading-relaxed mb-4 line-clamp-4">
                                {mainArticle.content}
                            </p>
                        </div>
                    </div>
                </div>
              )}

              {/* Gallery Strip (Preserving JejuQQ UI) */}
              <div className="grid grid-cols-3 gap-6 mb-12">
                 {galleryArticles.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group">
                        <div className="relative aspect-[4/3] overflow-hidden mb-3 bg-gray-100">
                            <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                        </div>
                        <h4 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-[#ff4500]">
                            {article.title}
                        </h4>
                    </Link>
                 ))}
              </div>

              {/* Latest Stories Section (JejuQQ UI) */}
              <div className="border-t-2 border-black pt-8">
                 <h3 className="text-2xl font-serif font-bold mb-8 uppercase tracking-tighter">Latest Stories</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                    {latestStories.map((article) => (
                        <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 group">
                            <div className="relative w-24 aspect-square shrink-0 rounded-full overflow-hidden border-2 border-[#ff4500]/20 group-hover:border-[#ff4500] transition-colors bg-gray-100">
                                <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[10px] text-[#ff4500] font-bold uppercase mb-1 block tracking-widest">{article.category?.categoryName}</span>
                                <h5 className="text-[15px] font-bold leading-snug group-hover:underline">{article.title}</h5>
                            </div>
                        </Link>
                    ))}
                 </div>
              </div>
            </div>

            {/* Right Sidebar (JejuQQ UI: Trending + Ad) */}
            <aside className="lg:col-span-4">
               <div className="border-t-4 border-black pt-4">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-bold flex items-center gap-2">
                        Trending <TrendingUp size={18} className="text-[#ff4500]" />
                     </h3>
                     <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#ff4500]"></span>
                        <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                     </div>
                  </div>

                  <div className="space-y-6">
                     {trendingArticles.map((article, i) => (
                        <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 items-start group">
                           <span className="w-6 h-6 bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                           </span>
                           <div>
                             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">{article.category?.categoryName}</span>
                             <h4 className="text-[14px] font-medium leading-snug group-hover:text-[#ff4500] transition-colors line-clamp-2">
                                {article.title}
                             </h4>
                           </div>
                        </Link>
                     ))}
                  </div>
               </div>

               <div className="mt-12 sticky top-24">
                  <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
               </div>
            </aside>

          </div>

          {/* Bottom Sections (JejuQQ UI) */}
          <div className="mt-16 space-y-16">
            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <section className="border-t-4 border-black pt-8">
                <h3 className="text-2xl font-serif font-bold mb-8 uppercase tracking-widest">Featured Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {featuredArticles.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group">
                      <div className="relative aspect-[4/3] overflow-hidden mb-4 border border-gray-100 bg-gray-50">
                        <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <span className="text-[10px] text-[#ff4500] font-bold uppercase mb-2 block">{article.category?.categoryName}</span>
                      <h4 className="text-lg font-bold leading-tight group-hover:underline">{article.title}</h4>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Products / Blogs */}
            {trendingProducts.length > 0 && (
              <section className="border-t border-gray-200 pt-8 pb-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">Explore <ChevronRight size={18} className="text-[#ff4500]"/></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {trendingProducts.map((article: any) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 group bg-gray-50 p-4 hover:bg-black hover:text-white transition-colors">
                      <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-md bg-gray-200">
                         <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="text-sm font-bold leading-snug line-clamp-2">{article.title}</h4>
                        <span className="text-[10px] text-gray-500 group-hover:text-gray-400 mt-1 block">Read more</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </LandingClientWrapper>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;700&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
