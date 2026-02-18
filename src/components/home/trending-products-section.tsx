"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Article } from "@/lib/types";

interface TrendingProductsSectionProps {
  articles: Article[];
}

function truncateContent(content: string | null, maxLength = 100): string {
  if (!content) return "";
  const plain = content.replace(/<[^>]*>/g, "").trim();
  return plain.length <= maxLength ? plain : plain.slice(0, maxLength) + "…";
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
          <Link
            key={product.id}
            href={`/article/${product.id}`}
            className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 block"
          >
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              <img
                src={product.imageUrl ?? `https://placehold.co/400x300/e5e7eb/9ca3af?text=${encodeURIComponent(product.title.slice(0, 20))}`}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          </Link>
        ))}
      </div>
    </section>
  );
}
