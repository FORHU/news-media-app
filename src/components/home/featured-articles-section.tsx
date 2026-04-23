"use client";

import { useState } from "react";
import type { Article } from "@/lib/types";
import { ArticleLink } from "@/components/home/ArticleLink";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

interface FeaturedArticlesSectionProps {
  articles: Article[];
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
}: FeaturedArticlesSectionProps) {
  if (articles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {articles.map((article) => (
        <ArticleLink
          key={article.id}
          articleIdentifier={article.slug ?? article.id}
          href={`/article/${article.slug ?? article.id}`}
          className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 block"
        >
          <div className="relative h-32 bg-gray-200 overflow-hidden">
            <StoryImage
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2">
              <span className="inline-block bg-[#ff4500] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                {article.status ?? "article"}
              </span>
            </div>
          </div>
          <div className="p-3">
            {normalizeCategoryName(article.category?.categoryName) ? (
              <div className="text-xs text-[#ff4500] font-semibold mb-1 uppercase">
                {normalizeCategoryName(article.category?.categoryName)}
              </div>
            ) : null}
            <h3 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-[#ff4500] transition-colors line-clamp-2">
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
