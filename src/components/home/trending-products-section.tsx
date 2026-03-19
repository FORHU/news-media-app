"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { ArticleLink } from "@/components/home/ArticleLink";
import Image from "next/image";
import type { Article } from "@/lib/types";

interface TrendingProductsSectionProps {
  articles: Article[];
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
    <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <foreignObject x="20" y="20" width="360" height="260">
        <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%; display:flex; align-items:center; justify-content:center; text-align:center; color:white; font-family:sans-serif; font-size:18px; font-weight:bold; line-height:1.2; overflow:hidden;">
          ${title}
        </div>
      </foreignObject>
    </svg>
  `.trim().replace(/\n/g, '').replace(/"/g, "'");
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function ProductImage({ src, alt, fill, className }: { src: string; alt: string; fill?: boolean; className?: string }) {
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
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  );
}



export function TrendingProductsSection({
  articles,
}: TrendingProductsSectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trending Products</h2>
        <Link
          href="/?type=blog"
          className="text-sm text-[#ff4500] hover:underline font-medium flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((product) => (
          <ArticleLink
            key={product.id}
            articleId={product.id}
            href={`/article/${product.id}`}
            className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 block"
          >
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              <ProductImage
                src={product.imageUrl ?? `https://placehold.co/400x300/e5e7eb/9ca3af?text=${encodeURIComponent(product.title.slice(0, 20))}`}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-[#ff4500] transition-colors line-clamp-2">
                {product.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {truncateContent(product.content)}
              </p>
            </div>
          </ArticleLink>
        ))}
      </div>
    </section>
  );
}
