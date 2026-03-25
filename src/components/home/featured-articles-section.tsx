"use client";

import { useState } from "react";
import type { Article } from "@/lib/types";
import { ArticleLink } from "@/components/home/ArticleLink";
import Image from "next/image";

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



function getFallbackImage(title: string) {
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
  const color = colors[Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length];
  const svg = `
    <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <foreignObject x="30" y="30" width="540" height="340">
        <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%; display:flex; align-items:center; justify-content:center; text-align:center; color:white; font-family:sans-serif; font-size:24px; font-weight:bold; line-height:1.3; overflow:hidden;">
          ${title}
        </div>
      </foreignObject>
    </svg>
  `.trim().replace(/\n/g, '').replace(/"/g, "'");
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function FeaturedImage({ src, alt, fill, className }: { src: string; alt: string; fill?: boolean; className?: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const fallback = getFallbackImage(alt);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    <Image
      src={imgSrc || fallback}
      alt={alt}
      fill={fill}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  );
}

import { useEffect } from "react";

export function FeaturedArticlesSection({
  articles,
}: FeaturedArticlesSectionProps) {
  if (articles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {articles.map((article) => (
        <ArticleLink
          key={article.id}
          articleId={article.id}
          href={`/article/${article.id}`}
          className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 block"
        >
          <div className="relative h-32 bg-gray-200 overflow-hidden">
            <FeaturedImage
              src={article.imageUrl ?? `https://placehold.co/600x400/e5e7eb/9ca3af?text=${encodeURIComponent(article.title.slice(0, 20))}`}
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
            <div className="text-xs text-[#ff4500] font-semibold mb-1 uppercase">
              {article.category.categoryName}
            </div>
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
