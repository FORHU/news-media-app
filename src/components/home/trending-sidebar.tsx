"use client";

import type { Article } from "@/lib/types";
import { ArticleLink } from "@/components/home/ArticleLink";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import { getDomainColor } from "@/lib/domainColors";
import { useState, useEffect } from "react";


interface TrendingSidebarProps {
  articles: Article[];
  domain: string;
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TrendingSidebar({ articles, domain }: TrendingSidebarProps) {
  const domainColor = getDomainColor(domain);

  // Apply popularity-based sorting and limit to top 5
  const sortedArticles = [...articles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 10);

  const isSkyBluePrime = domain.includes('skyblueprime');
  const isVoiceJeju = domain.includes('voicejeju');
  const isJejuJapan = domain.includes('jejujapan');

  if (isSkyBluePrime) {
    return (
      <aside id="trending-stories" className="lg:col-span-1 scroll-mt-24">
        <div className="sticky top-24">
          <div className="border-t-[4px] border-sky-950 pt-3 mb-6">
            <h2 className="text-[13px] font-black text-sky-950 uppercase tracking-widest">Trending Stories</h2>
          </div>
          <div className="flex flex-col gap-5">
            {sortedArticles.map((article, index) => (
              <ArticleLink
                key={article.id}
                articleIdentifier={article.slug ?? article.id}
                href={`/article/${article.slug ?? article.id}`}
                className="group cursor-pointer flex gap-3 border-b border-sky-100 pb-5 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-sky-950 text-white flex items-center justify-center font-black text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {normalizeCategoryName(article.category?.categoryName) && (
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-1">
                      {normalizeCategoryName(article.category?.categoryName)}
                    </span>
                  )}
                  <h3 className="text-[15px] font-bold text-sky-950 leading-tight line-clamp-2 group-hover:text-sky-600 transition-colors">
                    {article.title}
                  </h3>
                </div>
              </ArticleLink>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (isJejuJapan) {
    return (
      <div id="trending-stories">
        <div className="bg-[#bc002d] px-4 py-2.5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white">トレンド記事</h2>
        </div>
        <div className="flex flex-col divide-y divide-gray-100">
          {sortedArticles.map((article, index) => (
            <ArticleLink
              key={article.id}
              articleIdentifier={article.slug ?? article.id}
              href={`/article/${article.slug ?? article.id}`}
              className="group cursor-pointer flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-[#bc002d] text-white flex items-center justify-center font-black text-[10px] mt-0.5">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                {normalizeCategoryName(article.category?.categoryName) && (
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-[#bc002d] mb-0.5">
                    {normalizeCategoryName(article.category?.categoryName)}
                  </span>
                )}
                <h3 className="text-[12px] font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-[#bc002d] transition-colors">
                  {article.title}
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {formatDate(article.createdAt)}
                </span>
              </div>
            </ArticleLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside id="trending-stories" className="lg:col-span-1 scroll-mt-24">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold text-gray-900 ${isVoiceJeju ? 'font-voltaire uppercase tracking-tight text-3xl border-b-2 border-black pb-2 w-full' : 'font-serif'}`}>
            Trending Stories
          </h2>
        </div>

        <div className="space-y-5">
          {sortedArticles.map((article, index) => (
            <ArticleLink
              key={article.id}
              articleIdentifier={article.slug ?? article.id}
              href={`/article/${article.slug ?? article.id}`}
              className="group cursor-pointer flex gap-3 hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2 block"
            >
              <div className="flex-shrink-0">
                {isVoiceJeju ? (
                  <span className="text-5xl font-voltaire font-normal text-gray-400 group-hover:text-black transition-colors shrink-0 leading-none">
                    {index + 1}
                  </span>
                ) : (
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: domainColor.hex }}
                  >
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {normalizeCategoryName(article.category?.categoryName) ? (
                  <div
                    className="text-xs font-semibold mb-1 uppercase"
                    style={{ color: domainColor.hex }}
                  >
                    {normalizeCategoryName(article.category?.categoryName)}
                  </div>
                ) : null}
                <h3
                  className={`text-sm font-bold text-gray-900 transition-colors line-clamp-2 mb-1 ${isVoiceJeju ? 'font-voltaire uppercase tracking-tight' : 'font-serif'}`}
                  onMouseEnter={(e) => e.currentTarget.style.color = domainColor.hex}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#111827'}
                >
                  {article.title}
                </h3>
                <div className="text-xs text-gray-600">
                  {formatDate(article.createdAt)}
                </div>
              </div>
            </ArticleLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
