"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight } from "lucide-react";
import type { Article } from "@/lib/types";

interface HeroSectionProps {
  articles: Article[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function HeroSection({ articles }: HeroSectionProps) {
  const [index, setIndex] = useState(0);
  const article = articles[index];
  const total = articles.length;

  if (!article) return null;

  const goPrev = () => setIndex((i) => (i === 0 ? total - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === total - 1 ? 0 : i + 1));

  const categoryLabel = article.category.toUpperCase().replace(/\s+/g, " ");

  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-black mb-6">Latest News</h2>

        <div className="relative">
          {/* Prev arrow */}
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 shadow transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Card */}
          <Link
            href={`/article/${article.id}`}
            className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[280px]">
              {/* Image side */}
              <div className="relative aspect-video md:aspect-auto md:min-h-[280px] bg-gray-900">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2 py-1 bg-[#ff4500] text-white text-xs font-bold uppercase rounded">
                  {categoryLabel}
                </span>
              </div>

              {/* Content side */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#ff4500] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    AI
                  </div>
                  <span className="text-sm text-gray-700">AI Content Writer</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(article.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    5 min read
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-black mb-3 line-clamp-2 group-hover:text-[#ff4500] transition-colors">
                  {article.title}
                </h1>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {article.description}
                </p>
                <span className="inline-flex items-center gap-1 text-[#ff4500] font-medium text-sm">
                  Read Full Article
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>

          {/* Next arrow */}
          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 shadow transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel dots */}
        <div className="flex justify-center gap-2 mt-6">
          {articles.slice(0, 5).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === index ? "bg-[#ff4500]" : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
