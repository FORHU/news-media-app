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
    .slice(0, 5);

  return (
    <aside id="trending-stories" className="lg:col-span-1 scroll-mt-24">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-gray-900">Trending Stories</h2>
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
                <div 
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: domainColor.hex }}
                >
                  {index + 1}
                </div>
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
                  className="text-sm font-serif font-bold text-gray-900 transition-colors line-clamp-2 mb-1"
                  onMouseEnter={(e) => e.currentTarget.style.color = domainColor.hex}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#111827'} // gray-900
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
