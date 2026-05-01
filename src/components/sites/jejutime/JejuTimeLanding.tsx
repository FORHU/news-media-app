import { Suspense } from "react";
import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { AdBanner } from "@/components/AdBanner";
import Image from "next/image";
import Link from "next/link";

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
  const mainArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);
  const latestArticles = articles.slice(4, 10);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#2D3748] font-roboto selection:bg-blue-100">
      <LandingClientWrapper footerBanners={banners.footer}>
        
        <main className="max-w-7xl mx-auto px-6 py-12">
          
          {/* Hero Section: Weightless Composition */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-24">
            
            {/* Main Floating Feature */}
            <div className="lg:col-span-8 group">
              {mainArticle && (
                <Link href={`/article/${mainArticle.slug || mainArticle.id}`}>
                  <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] group-hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] transition-all duration-700 hover:-translate-y-2 bg-white">
                    <Image 
                      src={mainArticle.imageUrl || "/placeholder.jpg"} 
                      alt={mainArticle.title}
                      fill
                      className="object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
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
                  </div>
                </Link>
              )}
            </div>

            {/* Secondary Floating Vertical Stack */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-8">
               {secondaryArticles.map((article) => (
                 <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                    <div className="flex gap-5 items-start">
                       <div className="relative w-28 aspect-square rounded-2xl overflow-hidden shadow-xl shadow-blue-100 group-hover:-translate-y-1 transition-transform duration-500 shrink-0">
                          <Image src={article.imageUrl || "/placeholder.jpg"} alt={article.title} fill className="object-cover" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Deep Blue</span>
                          <h3 className="text-[17px] font-bold leading-snug group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 opacity-40 text-[10px] font-bold uppercase tracking-tighter">
                             <span>4 min read</span>
                             <div className="w-1 h-1 rounded-full bg-slate-900" />
                             <span>Coastline</span>
                          </div>
                       </div>
                    </div>
                 </Link>
               ))}
            </div>
          </section>

          {/* Grid of Coastal News */}
          <section className="mb-24">
             <div className="flex items-center justify-between mb-12 border-b border-slate-200 pb-6">
                <h3 className="text-3xl font-playfair font-black text-blue-950">Basalt <span className="font-light italic text-slate-400">Currents</span></h3>
                <Link href="#" className="text-xs font-bold uppercase tracking-widest text-blue-600 hover:underline underline-offset-8">Browse Archive</Link>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {latestArticles.map((article) => (
                  <article key={article.id} className="group cursor-pointer">
                    <Link href={`/article/${article.slug || article.id}`}>
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 shadow-2xl shadow-blue-50 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-blue-200">
                        <Image src={article.imageUrl || "/placeholder.jpg"} alt={article.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                      </div>
                      <h4 className="text-xl font-bold mb-3 leading-tight group-hover:text-blue-600 transition-colors">{article.title}</h4>
                      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-light">{article.content}</p>
                    </Link>
                  </article>
                ))}
             </div>
          </section>

          <div className="my-24">
             <AdBanner position="HOME_TOP" initialBanners={banners.top} />
          </div>

        </main>
      </LandingClientWrapper>
    </div>
  );
}


