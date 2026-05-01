"use client";

import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, Clock, ChevronRight } from "lucide-react";

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
  const heroArticle = articles[0];
  const listArticles = articles.slice(1, 6);
  const gridArticles = articles.slice(6, 12);
  const trendingArticles = articles.slice(12, 17);

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <LandingClientWrapper footerBanners={banners.footer}>
        <main className="max-w-7xl mx-auto px-6 py-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Content Area */}
            <div className="lg:col-span-8">
              
              {/* Hero Section */}
              {heroArticle && (
                <div className="mb-12 group">
                  <Link href={`/article/${heroArticle.slug || heroArticle.id}`}>
                    <div className="relative aspect-[21/9] overflow-hidden mb-6">
                      <Image 
                        src={heroArticle.imageUrl || "/placeholder.jpg"} 
                        alt={heroArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                      <div className="absolute top-4 left-4 bg-[#bc002d] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                         Top Story
                      </div>
                    </div>
                    <h2 className="text-4xl font-serif font-black leading-tight mb-4 hover:text-[#bc002d] transition-colors">
                      {heroArticle.title}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed line-clamp-3 font-light">
                      {heroArticle.content}
                    </p>
                  </Link>
                </div>
              )}

              {/* Secondary List */}
              <div className="space-y-8 border-t border-gray-100 pt-8">
                 {listArticles.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex flex-col md:flex-row gap-8 group">
                       <div className="relative w-full md:w-60 aspect-[16/10] overflow-hidden shrink-0">
                          <Image src={article.imageUrl || "/placeholder.jpg"} alt={article.title} fill className="object-cover" />
                       </div>
                       <div className="flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-[#bc002d] uppercase tracking-widest mb-2">{article.category?.categoryName}</span>
                          <h3 className="text-xl font-bold leading-tight mb-3 group-hover:text-[#bc002d] transition-colors">{article.title}</h3>
                          <div className="flex items-center text-[10px] text-gray-400 font-bold gap-4 uppercase">
                             <span className="flex items-center gap-1"><Clock size={10} /> 2 hours ago</span>
                             <span>By Bureau Tokyo</span>
                          </div>
                       </div>
                    </Link>
                 ))}
              </div>
            </div>

            {/* Right Sidebar (Trending & Precision) */}
            <aside className="lg:col-span-4">
               <div className="bg-[#111] text-white p-8">
                  <h3 className="text-lg font-serif font-black flex items-center gap-2 mb-8 uppercase tracking-widest border-b border-white/20 pb-4">
                     <TrendingUp size={20} className="text-[#bc002d]" /> Popular
                  </h3>
                  <div className="space-y-8">
                     {trendingArticles.map((article, i) => (
                        <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                           <div className="flex gap-4">
                              <span className="text-3xl font-serif font-black text-white/20 group-hover:text-[#bc002d] transition-colors">0{i + 1}</span>
                              <h4 className="text-sm font-bold leading-snug group-hover:text-white/80">{article.title}</h4>
                           </div>
                        </Link>
                     ))}
                  </div>
               </div>

               <div className="mt-12 py-8 border-t-2 border-black">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-6">Briefing</h3>
                  <div className="space-y-4">
                     {[1,2,3].map(i => (
                        <div key={i} className="bg-gray-50 p-4 border-l-4 border-[#bc002d]">
                           <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Exchange Rate</span>
                           <p className="text-xs font-bold font-mono">JPY/KRW 9.04 <span className="text-green-600">▲ 0.02%</span></p>
                        </div>
                     ))}
                  </div>
               </div>
            </aside>

          </div>

          {/* Bottom Grid */}
          <section className="mt-24 border-t-4 border-black pt-12">
             <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-serif font-black uppercase tracking-widest">Regional Report</h3>
                <Link href="#" className="text-xs font-bold flex items-center gap-1 hover:text-[#bc002d]">View All <ChevronRight size={14}/></Link>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {gridArticles.map((article) => (
                   <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group">
                      <div className="relative aspect-[16/10] overflow-hidden mb-6">
                         <Image src={article.imageUrl || "/placeholder.jpg"} alt={article.title} fill className="object-cover" />
                      </div>
                      <h4 className="text-lg font-bold leading-tight group-hover:text-[#bc002d] transition-colors">{article.title}</h4>
                      <p className="text-sm text-gray-500 mt-4 line-clamp-2 font-light">{article.content}</p>
                   </Link>
                ))}
             </div>
          </section>

        </main>
      </LandingClientWrapper>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Playfair+Display:wght@900&display=swap');
        
        body {
          font-family: 'Noto Sans JP', sans-serif;
        }
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
      `}</style>
    </div>
  );
}
