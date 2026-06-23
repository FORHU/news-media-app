"use client";

import type { Article } from "@/lib/types";
import { ArticleLink } from "@/components/home/ArticleLink";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

import { getDomainColor } from "@/lib/domainColors";

interface FeaturedArticlesSectionProps {
  articles: Article[];
  domain?: string;
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateContent(content: string | null, maxLength = 100): string {
  if (!content) return "";
  const plain = content.replace(/<[^>]*>/g, "").trim();
  return plain.length <= maxLength ? plain : plain.slice(0, maxLength) + "…";
}

import { StoryImage } from "@/components/StoryImage";


export function FeaturedArticlesSection({
  articles,
  domain = "newsicons.com",
}: FeaturedArticlesSectionProps) {
  if (articles.length === 0) return null;
  const domainColor = getDomainColor(domain);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-0">
      {articles.map((article) => (
        <ArticleLink
          key={article.id}
          articleIdentifier={article.slug ?? article.id}
          href={`/article/${article.slug ?? article.id}`}
          className={`group cursor-pointer bg-white border-2 ${domain === 'jejuqq.com' ? 'border-[#dc2626]' : 'border-gray-100'} rounded-none overflow-hidden hover:shadow-xl transition-all duration-300 block`}
        >
          <div className="relative h-32 bg-gray-200 overflow-hidden">
            <StoryImage
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />

          </div>
          <div className="p-3">
            {normalizeCategoryName(article.category?.categoryName) ? (
              <div
                className="text-xs font-semibold mb-1 uppercase"
                style={{ color: domainColor.hex }}
              >
                {normalizeCategoryName(article.category?.categoryName)}
              </div>
            ) : null}
            <h3
              className="text-sm font-serif font-bold text-gray-900 mb-2 transition-colors line-clamp-2"
              onMouseEnter={(e) => e.currentTarget.style.color = domainColor.hex}
              onMouseLeave={(e) => e.currentTarget.style.color = '#111827'}
            >
              {article.title}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {truncateContent(article.content)}
            </p>
            <div className="text-xs text-gray-500">
              {formatDate(article.createdAt)}
            </div>
          </div>
        </ArticleLink>
      ))}
    </div>
  );
}
