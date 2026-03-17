"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight } from "lucide-react";
import { ArticleLink } from "@/components/home/ArticleLink";
import { motion, AnimatePresence } from "framer-motion";
import type { Article } from "@/lib/types";

interface HeroSectionProps {
  articles: Article[];
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0
  })
};

function truncateContent(content: string | null, maxLength = 160): string {
  if (!content) return "";
  const plain = content.replace(/<[^>]*>/g, "").trim();
  return plain.length <= maxLength ? plain : plain.slice(0, maxLength) + "…";
}

export function HeroSection({ articles }: HeroSectionProps) {
  const [[page, direction], setPage] = useState([0, 0]);
  const index = Math.abs(page % articles.length);
  const article = articles[index];

  if (!article) return null;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const categoryLabel = article.category.categoryName.toUpperCase().replace(/\s+/g, " ");

  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-black mb-6">Latest News</h2>

        <div>
          {/* Main article carousel */}
          <div>
            <div className="relative h-[480px] sm:h-[400px] md:h-[360px] lg:h-[380px] v-short:h-[280px]">
              {/* Prev arrow */}
              <button
                type="button"
                onClick={() => paginate(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 shadow transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Card with Animation */}
              <div className="relative h-full overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-lg">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="h-full"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                  >
                    <ArticleLink
                      articleId={article.id}
                      href={`/article/${article.id}`}
                      className="block h-full bg-white"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-0">
                        {/* Image side */}
                        <div className="relative aspect-video md:aspect-auto md:h-full min-h-0 bg-gray-900">
                          <SafeImage
                            src={article.imageUrl ?? `https://placehold.co/800x400/e5e7eb/9ca3af?text=${encodeURIComponent(article.title.slice(0, 30))}`}
                            alt={article.title}
                            title={article.title}
                            fill
                            priority={index === 0}
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          <span className="absolute top-3 left-3 px-2 py-1 bg-[#ff4500] text-white text-xs font-bold uppercase rounded z-10">
                            {categoryLabel}
                          </span>
                        </div>

                        {/* Content side */}
                        <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-center min-h-0 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 shrink-0 flex-wrap">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#ff4500] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                              AI
                            </div>
                            <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">AI Content Writer</span>
                            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                              <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                              {formatDate(article.createdAt)}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                              5 min read
                            </span>
                          </div>
                          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-2 sm:mb-3 line-clamp-2 md:line-clamp-3 group-hover:text-[#ff4500] transition-colors">
                            {article.title}
                          </h1>
                          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                            {truncateContent(article.content)}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[#ff4500] font-medium text-xs sm:text-sm">
                            Read Full Article
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          </span>
                        </div>
                      </div>
                    </ArticleLink>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Next arrow */}
              <button
                type="button"
                onClick={() => paginate(1)}
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
                  onClick={() => {
                    const newDirection = i > index ? 1 : -1;
                    setPage([i, newDirection]);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-[#ff4500]" : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
