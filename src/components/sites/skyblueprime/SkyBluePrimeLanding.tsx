"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { StoryImage } from "@/components/StoryImage";

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => (
    <div className="h-[100px] animate-pulse bg-sky-50 rounded-xl border border-sky-100" />
  ),
});

interface ArticleRow {
  id: string;
  slug?: string | null;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  trendingScore?: number | null;
  category?: { categoryName?: string | null } | null;
}

interface Props {
  tenantId: string | null;
  articles: ArticleRow[];
  banners: {
    top: unknown[];
    sidebar: unknown[];
    footer: unknown[];
  };
}

function articleHref(article: { slug?: string | null; id: string }) {
  return `/article/${article.slug || article.id}`;
}

function excerpt(text: string | null | undefined, max = 120) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

export default function SkyBluePrimeLanding({ articles, banners }: Props) {
  const sorted = [...articles].sort((a, b) => {
    if ((b.trendingScore ?? 0) !== (a.trendingScore ?? 0)) {
      return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const hero = sorted[0];
  const picks = sorted.slice(1, 4);
  const trending = sorted.slice(0, 5);

  const groupedCategoriesMap = new Map<string, ArticleRow[]>();
  for (const a of sorted) {
    const cat = a.category?.categoryName || "Uncategorized";
    if (!groupedCategoriesMap.has(cat)) groupedCategoriesMap.set(cat, []);
    groupedCategoriesMap.get(cat)!.push(a);
  }
  const groupedCategories = Array.from(groupedCategoriesMap.entries()).map(([name, items]) => ({ name, items }));

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner Area */}
      {banners.top && banners.top.length > 0 ? (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 border-b border-sky-100 mb-8">
          <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
        </div>
      ) : (
        <div className="mt-8"></div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* Left Column: Today's Picks */}
          <aside className="lg:col-span-3 order-2 lg:order-1 flex flex-col gap-8">
            <div className="border-t-4 border-sky-950 pt-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-sky-950 bg-sky-950 text-white inline-block px-2 py-1 mb-6">
                Today's Picks
              </h2>
              <div className="space-y-8">
                {picks.map((article) => (
                  <Link
                    key={article.id}
                    href={articleHref(article)}
                    className="group block"
                  >
                    <div className="relative aspect-[3/2] w-full mb-3 bg-sky-100 overflow-hidden">
                      <StoryImage
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 1024px) 100vw, 25vw"
                      />
                    </div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-1">
                      {article.category?.categoryName ?? "News"}
                    </span>
                    <h3 className="text-lg font-bold text-sky-950 leading-tight group-hover:text-sky-600 transition-colors">
                      {article.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Middle Column: Hero Article */}
          <section className="lg:col-span-6 order-1 lg:order-2">
            {hero ? (
              <article className="flex flex-col items-center text-center">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-4">
                  {hero.category?.categoryName ?? "Featured Story"}
                </span>
                
                <Link href={articleHref(hero)} className="group block mb-6">
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-sky-950 leading-[1.05] tracking-tight group-hover:text-sky-700 transition-colors">
                    {hero.title}
                  </h1>
                </Link>

                <p className="text-lg sm:text-xl text-sky-800/90 max-w-2xl mb-8 leading-relaxed font-medium">
                  {excerpt(hero.content, 200)}
                </p>

                <div className="w-full relative aspect-[16/9] bg-sky-100 overflow-hidden">
                  <Link href={articleHref(hero)} className="group block w-full h-full">
                    <StoryImage
                      src={hero.imageUrl}
                      alt={hero.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </Link>
                </div>
              </article>
            ) : (
              <div className="border-t-4 border-sky-950 pt-16 text-center">
                <p className="text-sky-600 font-medium text-xl">No published articles yet.</p>
                <p className="text-sm text-sky-500 mt-2">Check back soon for the latest from Sky Blue Prime.</p>
              </div>
            )}
          </section>

          {/* Right Column: Trending Stories */}
          <aside className="lg:col-span-3 order-3 flex flex-col gap-8">
            <div className="border-t-4 border-sky-950 pt-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-sky-950 bg-sky-950 text-white inline-block px-2 py-1 mb-6">
                Trending Stories
              </h2>
              <ol className="space-y-6">
                {trending.map((article) => (
                  <li key={article.id} className="border-b border-sky-100 pb-6 last:border-0 last:pb-0">
                    <Link href={articleHref(article)} className="group block">
                      <h3 className="text-[1.35rem] font-bold text-sky-950 leading-tight group-hover:text-sky-600 transition-colors">
                        {article.title}
                      </h3>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            
            <div className="mt-8">
              <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar as never[]} />
            </div>
          </aside>

        </div>

        {/* Category Blocks */}
        {groupedCategories.map(group => {
           const heroArticle = group.items[0];
           const otherArticles = group.items.slice(1, 5);
           if (!heroArticle) return null;

           return (
             <section key={group.name} className="mt-24">
               {/* Section Header */}
               <div className="border-t-[6px] border-sky-950 pt-3 mb-10">
                 <h2 className="text-sm font-black uppercase tracking-widest text-white bg-sky-950 inline-block px-3 py-1.5 leading-none">
                   {group.name}
                 </h2>
               </div>

               {/* Hero Article */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-10">
                 <div className="lg:col-span-8 relative aspect-[16/9] lg:aspect-auto lg:h-[500px] overflow-hidden bg-sky-100 group">
                   <Link href={articleHref(heroArticle)} className="block w-full h-full">
                     <StoryImage 
                       src={heroArticle.imageUrl} 
                       fill 
                       className="object-cover group-hover:scale-105 transition-transform duration-700" 
                       alt={heroArticle.title} 
                       sizes="(max-width: 1024px) 100vw, 66vw"
                     />
                   </Link>
                 </div>
                 <div className="lg:col-span-4 flex flex-col justify-center">
                   <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-5 block">
                     {heroArticle.category?.categoryName}
                   </span>
                   <Link href={articleHref(heroArticle)} className="block mb-5 group">
                     <h3 className="text-4xl sm:text-5xl font-black text-sky-950 leading-[1.05] tracking-tight group-hover:text-sky-700 transition-colors">
                       {heroArticle.title}
                     </h3>
                   </Link>
                   <p className="text-lg text-sky-800/90 mb-8 font-medium leading-relaxed">
                     {excerpt(heroArticle.content, 200)}
                   </p>
                   <span className="text-[11px] font-bold uppercase tracking-widest text-sky-950">
                     BY SKY BLUE PRIME
                   </span>
                 </div>
               </div>

               {/* Sub-Articles Grid */}
               {otherArticles.length > 0 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 border-t border-sky-200 pt-8">
                   {otherArticles.map(article => (
                     <Link href={articleHref(article)} key={article.id} className="grid grid-cols-[1fr_90px] gap-4 group items-start">
                        <div className="flex flex-col justify-start">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-2 block leading-none">
                            {article.category?.categoryName}
                          </span>
                          <h4 className="text-[16px] font-bold text-sky-950 leading-snug group-hover:text-sky-600 transition-colors">
                            {article.title}
                          </h4>
                        </div>
                        <div className="relative w-[90px] h-[90px] bg-sky-100 overflow-hidden shrink-0">
                          <StoryImage 
                            src={article.imageUrl} 
                            alt={article.title} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                            sizes="90px"
                          />
                        </div>
                     </Link>
                   ))}
                 </div>
               )}
             </section>
           );
        })}
      </main>
    </div>
  );
}
