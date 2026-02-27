"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import type { Article } from "@/lib/types";

interface LatestStoriesSectionProps {
  articles: Article[];
  error: string;
  searchQuery: string | null;
  isLoading?: boolean;
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateContent(content: string | null, maxLength = 120): string {
  if (!content) return "";
  const plain = content.replace(/<[^>]*>/g, "").trim();
  return plain.length <= maxLength ? plain : plain.slice(0, maxLength) + "…";
}

export function LatestStoriesSection({
  articles,
  error,
  searchQuery,
  isLoading = false,
}: LatestStoriesSectionProps) {
  const router = useRouter();
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(articles.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const latestStories = articles.slice(startIndex, endIndex);

  const clearSearch = () => {
    router.push("/");
  };

  return (
    <div className="lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Latest Stories</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-row gap-4 pb-6 border-b border-gray-200 rounded-lg p-2 sm:p-3 animate-pulse"
            >
              <div className="relative w-28 sm:w-40 h-20 sm:h-28 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">{error}</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No articles found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search terms
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-6 py-2.5 bg-[#ff4500] text-white rounded-lg hover:bg-[#e63e00] transition-colors font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(searchQuery ? articles : latestStories).map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="group cursor-pointer flex flex-row gap-4 pb-6 border-b border-gray-200 hover:bg-gray-50 transition-colors rounded-lg p-2 sm:p-3"
            >
              <div className="relative w-28 sm:w-40 h-20 sm:h-28 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={article.imageUrl ?? `https://placehold.co/400x200/e5e7eb/9ca3af?text=${encodeURIComponent(article.title.slice(0, 20))}`}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                    {article.category.categoryName}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#ff4500] transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {truncateContent(article.content)}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(article.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    5 min read
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination Controls */}
          {!searchQuery && articles.length > 0 && (
            <div className="mt-8 pt-6 ">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-500">
                  {startIndex + 1}–{Math.min(endIndex, articles.length)} of{" "}
                  {articles.length}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md transition-colors ${currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md transition-colors ${currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {[5, 10, 15]
                    .filter((count) => {
                      if (count === 15) return articles.length > 10;
                      if (count === 10) return articles.length > 5;
                      return true;
                    })
                    .map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setItemsPerPage(count);
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${itemsPerPage === count
                          ? "bg-[#ff4500] text-white"
                          : "text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        {count}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
