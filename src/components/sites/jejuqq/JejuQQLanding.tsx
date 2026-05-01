"use client";

import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
  const latestNews = articles.slice(4, 14);

  return (
    <div className="min-h-screen bg-white text-[#222]">
      <LandingClientWrapper footerBanners={banners.footer}>
        <main className="max-w-7xl mx-auto px-4 py-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Content Area (Hero + Gallery) */}
            <div className="lg:col-span-8">
              {/* Main Article Section */}
              {mainArticle && (
                <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <Link href={`/article/${mainArticle.slug || mainArticle.id}`} className="block relative aspect-[4/3] overflow-hidden">
                            <Image 
                                src={mainArticle.imageUrl || "/placeholder.jpg"} 
                                alt={mainArticle.title}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-700"
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

              {/* Gallery Strip */}
              <div className="grid grid-cols-3 gap-6 mb-12">
                 {galleryArticles.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group">
                        <div className="relative aspect-[4/3] overflow-hidden mb-3">
                            <Image src={article.imageUrl || "/placeholder.jpg"} alt={article.title} fill className="object-cover" />
                        </div>
                        <h4 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-[#ff4500]">
                            {article.title}
                        </h4>
                    </Link>
                 ))}
              </div>

              {/* Secondary Feed */}
              <div className="border-t-2 border-black pt-8">
                 <h3 className="text-2xl font-serif font-bold mb-8 uppercase tracking-tighter">Insights & Opinions</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                    {articles.slice(14, 20).map((article) => (
                        <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 group">
                            <div className="relative w-24 aspect-square shrink-0 rounded-full overflow-hidden border-2 border-[#ff4500]/20">
                                <Image src={article.imageUrl || "/placeholder.jpg"} alt={article.title} fill className="object-cover" />
                            </div>
                            <div>
                                <h5 className="text-[15px] font-bold leading-snug group-hover:underline">{article.title}</h5>
                                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block tracking-widest">{article.category?.categoryName}</span>
                            </div>
                        </Link>
                    ))}
                 </div>
              </div>
            </div>

            {/* Right Sidebar (Latest News Numbered List) */}
            <aside className="lg:col-span-4">
               <div className="border-t-4 border-black pt-4">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-bold flex items-center gap-1">
                        Latest News <ChevronRight size={18} className="text-[#ff4500]" />
                     </h3>
                     <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#ff4500]"></span>
                        <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                        <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                     </div>
                  </div>

                  <div className="space-y-6">
                     {latestNews.map((article, i) => (
                        <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 items-start group">
                           <span className="w-6 h-6 bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                           </span>
                           <h4 className="text-[14px] font-medium leading-snug group-hover:text-[#ff4500] transition-colors">
                              {article.title}
                           </h4>
                        </Link>
                     ))}
                  </div>
               </div>

               <div className="mt-12 sticky top-24">
                  {/* Banners etc */}
               </div>
            </aside>

          </div>
        </main>
      </LandingClientWrapper>

      <style jsx global>{`
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
      `}</style>
    </div>
  );
}
