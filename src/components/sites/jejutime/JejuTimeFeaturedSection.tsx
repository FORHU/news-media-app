"use client";

import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";
import type { Article } from "@/lib/types";

interface Props {
  articles: Article[];
}

export default function JejuTimeFeaturedSection({ articles }: Props) {
  if (!articles || articles.length === 0) return null;

  // Split articles into chunks of 4 for the 2-column layout
  const chunks = [];
  for (let i = 0; i < articles.length; i += 4) {
    chunks.push(articles.slice(i, i + 4));
  }

  return (
    <section className="mb-10">
      <div className={`grid grid-cols-1 ${chunks.length > 1 ? 'md:grid-cols-2' : ''} gap-x-8 gap-y-12`}>
        {chunks.map((chunk, chunkIdx) => (
          <div key={chunkIdx} className="flex flex-col">
            {chunk.map((article, i) => {
              // Deterministic meta-info to prevent hydration errors
              const readTime = ((chunkIdx * 3 + i) % 5) + 2;
              const engagement = ((chunkIdx * 2 + i) % 9) + 1;

              if (i === 0) {
                return (
                  <Link 
                    key={article.id} 
                    href={`/article/${article.slug || article.id}`} 
                    className="group block mb-8"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden mb-6 bg-slate-100 shadow-xl shadow-blue-50/50 group-hover:shadow-blue-100/50 transition-all duration-300">
                      <StoryImage 
                        src={article.imageUrl} 
                        alt={article.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                        sizes="(max-width: 1024px) 100vw, 800px" 
                      />
                      <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1 text-[11px] font-black uppercase tracking-widest shadow-lg z-10">
                        {article.category?.categoryName || "Nature & Outdoors"}
                      </div>
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-black leading-tight group-hover:text-blue-600 transition-colors mb-4 text-slate-900 tracking-tight">
                      {article.title}
                    </h4>
                    <p className="text-slate-600 text-sm sm:text-base line-clamp-3 leading-relaxed font-light mb-5">
                      {article.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {readTime} min read
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {engagement}.{i}k
                      </span>
                    </div>
                  </Link>
                );
              }
              if (i === 1 || i === 2) {
                return (
                  <Link 
                    key={article.id} 
                    href={`/article/${article.slug || article.id}`} 
                    className="group flex gap-6 py-6 border-t border-slate-200"
                  >
                    <div className="relative w-[130px] aspect-[4/3] shrink-0 overflow-hidden bg-slate-100 shadow-sm">
                      <StoryImage 
                        src={article.imageUrl} 
                        alt={article.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-300" 
                        sizes="130px" 
                      />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-[18px] font-bold leading-snug group-hover:text-blue-600 transition-colors text-slate-900 tracking-tight line-clamp-2">
                        {article.title}
                      </h4>
                    </div>
                  </Link>
                );
              }
              return (
                <Link 
                  key={article.id} 
                  href={`/article/${article.slug || article.id}`} 
                  className="group block py-6 border-t border-slate-200"
                >
                  <h4 className="text-[18px] font-bold leading-snug group-hover:text-blue-600 transition-colors text-slate-900 tracking-tight">
                    {article.title}
                  </h4>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
