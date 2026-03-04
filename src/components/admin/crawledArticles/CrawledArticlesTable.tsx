import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Newspaper,
  Eye,
} from "lucide-react";

interface CrawledArticleRow {
  id: number;
  title: string;
  url: string;
  source: string;
  date: string;
  dateValue: string | null;
  content: string;
  imageUrl: string | null;
  status: string;
}

interface CrawledArticlesTableProps {
  rows: CrawledArticleRow[];
  totalCount: number;
  isLoading: boolean;
  errorMessage: string;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: number) => void;
  onView: (row: CrawledArticleRow) => void;
}

export function CrawledArticlesTable({
  rows,
  totalCount,
  isLoading,
  errorMessage,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onView,
}: CrawledArticlesTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
      <table className="w-full text-left">
        <thead className="bg-[#fafafa] border-b border-gray-100">
          <tr>
            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Article Information
            </th>
            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Source
            </th>
            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Status
            </th>
            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Crawl Date
            </th>
            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td
                colSpan={5}
                className="px-8 py-16 text-center text-sm text-gray-500"
              >
                Loading crawled articles...
              </td>
            </tr>
          ) : errorMessage ? (
            <tr>
              <td
                colSpan={5}
                className="px-8 py-16 text-center text-sm text-red-600"
              >
                {errorMessage}
              </td>
            </tr>
          ) : totalCount > 0 ? (
            rows.map((item) => (
              <tr
                key={item.id}
                className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200"
              >
                {/* Article information */}
                <td className="px-3 sm:px-6 py-4 sm:py-5">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <img
                      src={
                        item.imageUrl ??
                        `https://placehold.co/96x96/e5e7eb/9ca3af?text=${encodeURIComponent(
                          item.title.slice(0, 12) || "RAW"
                        )}`
                      }
                      alt={item.title}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl shadow-md flex-shrink-0 bg-gray-100"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5 font-medium break-all">
                        {item.url || "No source URL"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Source */}
                <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  {item.url ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(item.url, "_blank", "noopener,noreferrer");
                      }}
                      className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm max-w-[200px] truncate hover:from-gray-200 hover:to-gray-300 transition-colors"
                    >
                      <Globe className="w-3 h-3 mr-1 text-gray-500" />
                      {item.source || item.url}
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-gray-100 text-gray-500 shadow-sm max-w-[200px] truncate">
                      <Globe className="w-3 h-3 mr-1 text-gray-400" />
                      Unknown source
                    </span>
                  )}
                </td>

                {/* Status (debug-friendly) */}
                <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold shadow-sm bg-gray-200 text-gray-800">
                    {item.status ?? "Unknown"}
                  </span>
                </td>

                {/* Crawl date */}
                <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-xs sm:text-sm text-gray-600 font-medium">
                  {item.dateValue ?? "—"}
                </td>

                {/* Actions */}
                <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => onView(item)}
                      className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="px-8 py-32 text-center"
              >
                <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                  <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
                    <Newspaper className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      No Articles Yet
                    </h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                      No articles have been crawled yet. Check your source
                      configurations or trigger a manual crawl.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalCount > 0 && (
        <div className="px-6 sm:px-8 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {/* Left: Items count */}
            <div className="text-sm text-gray-500">
              {startIndex + 1}–
              {Math.min(endIndex, totalCount)} of {totalCount}
            </div>

            {/* Center: Page Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-md transition-colors ${
                  currentPage === 1
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
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md transition-colors ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Items per page selector */}
            <div className="flex items-center gap-1">
              {[5, 10, 15].map((count) => (
                <button
                  key={count}
                  onClick={() => onItemsPerPageChange(count)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    itemsPerPage === count
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
  );
}