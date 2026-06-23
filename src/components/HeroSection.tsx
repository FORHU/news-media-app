"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight } from "lucide-react";
import { ArticleLink } from "@/components/home/ArticleLink";
import { motion, AnimatePresence } from "framer-motion";
import { StoryImage } from "@/components/StoryImage";
import type { Article } from "@/lib/types";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

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

  const categoryLabel = normalizeCategoryName(article.category?.categoryName)
    ?.toUpperCase()
    .replace(/\s+/g, " ");

  const nextIndex = (index + 1) % articles.length;
  const nextArticle = articles[nextIndex];

  return (
    <section className="bg-white">
      {/* Pre-load next image for smoother transitions */}
      {nextArticle?.imageUrl && (
        <div className="hidden" aria-hidden="true">
          <StoryImage 
            src={nextArticle.imageUrl} 
            alt="preload" 
            width={10} 
            height={10} 
            priority={true} 
          />
        </div>
      )}
      <div className="py-4">

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
                      articleIdentifier={article.slug ?? article.id}
                      href={`/article/${article.slug ?? article.id}`}
                      className="block h-full bg-white"
                    >
                      <div className="flex flex-col md:grid md:grid-cols-2 h-full min-h-0">
                        {/* Image side */}
                        <div className="relative w-full aspect-video md:aspect-auto md:h-full bg-gray-200 flex items-center justify-center shrink-0">
                          <StoryImage
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                            priority={index === 0}
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            variant="hero"
                          />
                          {categoryLabel ? (
                            <span className="absolute top-3 left-3 px-2 py-1 bg-[#ff4500] text-white text-[10px] font-bold uppercase rounded z-10">
                              {categoryLabel}
                            </span>
                          ) : null}
                        </div>

                        {/* Content side */}
                        <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-center min-h-0 min-w-0 overflow-hidden flex-1">
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
                          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-serif font-bold text-black mb-1 sm:mb-2 line-clamp-2 md:line-clamp-3 group-hover:text-[#ff4500] transition-colors">
                            {article.title}
                          </h1>
                          <p className="text-gray-600 text-[11px] sm:text-xs mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 md:block">
                            {truncateContent(article.content, 120)}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[#ff4500] font-medium text-xs sm:text-sm mt-auto">
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
