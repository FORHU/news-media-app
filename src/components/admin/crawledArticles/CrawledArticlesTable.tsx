import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Eye,
  Sparkles,
  Loader2,
  Link as LinkIcon,
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
  selectedArticleIds?: number[];
  onToggleArticle?: (id: number) => void;
  onSelectAll?: () => void;
  allPendingOnPageSelected?: boolean;
  pendingCountOnPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: number) => void;
  onView: (row: CrawledArticleRow) => void;
  onGenerate?: (row: CrawledArticleRow) => void;
}

const COL_COUNT_WITH_CHECKBOX = 6;
const COL_COUNT_WITHOUT_CHECKBOX = 5;

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
  selectedArticleIds = [],
  onToggleArticle,
  onSelectAll,
  allPendingOnPageSelected = false,
  pendingCountOnPage = 0,
  onPageChange,
  onItemsPerPageChange,
  onView,
  onGenerate,
}: CrawledArticlesTableProps) {
  const showCheckboxes = Boolean(onSelectAll && onToggleArticle);
  const colSpan = showCheckboxes ? COL_COUNT_WITH_CHECKBOX : COL_COUNT_WITHOUT_CHECKBOX;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-shadow duration-300 min-h-[400px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              {showCheckboxes && (
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={pendingCountOnPage > 0 && allPendingOnPageSelected}
                      onChange={onSelectAll}
                      className="w-5 h-5 text-[#ff4500] bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff4500] focus:ring-offset-2 cursor-pointer transition-all duration-200 hover:border-[#ff4500] checked:bg-[#ff4500] checked:border-[#ff4500]"
                      title="Select all pending articles"
                      aria-label="Select all pending"
                    />
                  </div>
                </th>
              )}
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                Article Details
              </th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                Source
              </th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                Crawled
              </th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-8 py-16 text-center text-sm text-gray-500"
                >
                  <Loader2 className="w-12 h-12 text-[#ff4500] animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Loading crawled articles...</p>
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-8 py-16 text-center text-sm text-red-600"
                >
                  {errorMessage}
                </td>
              </tr>
            ) : totalCount > 0 ? (
              rows.map((item) => {
                const isPending = item.status === "pending";
                const isSelected = selectedArticleIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    onClick={() => isPending && onToggleArticle?.(item.id)}
                    className={`transition-all duration-200 ${
                      isPending ? "cursor-pointer hover:shadow-md" : ""
                    } ${
                      isSelected
                        ? "bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-[#ff4500] shadow-sm"
                        : isPending
                          ? "hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent"
                          : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent"
                    }`}
                  >
                    {showCheckboxes && (
                      <td
                        className="px-3 sm:px-4 py-4 sm:py-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPending ? (
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleArticle?.(item.id)}
                              className="w-5 h-5 text-[#ff4500] bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff4500] focus:ring-offset-2 cursor-pointer transition-all duration-200 hover:border-[#ff4500] checked:bg-[#ff4500] checked:border-[#ff4500]"
                              aria-label={`Select article ${item.id}`}
                            />
                          </div>
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                      </td>
                    )}
                    {/* Article Details */}
                    <td className="px-3 sm:px-6 py-4 sm:py-5">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <img
                          src={
                            item.imageUrl ??
                            `https://placehold.co/96x96/e5e7eb/9ca3af?text=${encodeURIComponent(
                              item.title.slice(0, 12) || "RAW"
                            )}`
                          }
                          alt=""
                          className="w-12 h-12 sm:w-20 sm:h-20 object-cover rounded-xl shadow-md flex-shrink-0 bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1 mb-1.5">
                            {item.content
                              ? (() => {
                                  const stripped = item.content.replace(/<[^>]*>/g, "").trim();
                                  return stripped.slice(0, 120) + (stripped.length > 120 ? "…" : "");
                                })()
                              : item.url || "No excerpt"}
                          </p>
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            news
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                          item.status === "pending"
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900"
                            : item.status === "processing"
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                              : "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        }`}
                      >
                        {item.status === "processing" && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        {item.status === "generated" && (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span className="capitalize">{item.status}</span>
                      </span>
                    </td>
                    {/* Source */}
                    <td className="px-3 sm:px-6 py-4 sm:py-5 hidden sm:table-cell">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1 max-w-[150px] truncate"
                          title={item.url}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <LinkIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">View Source</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    {/* Crawled */}
                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">
                          {item.date}
                        </span>
                        {item.dateValue && (
                          <span className="text-xs text-gray-400">{item.dateValue}</span>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(item);
                          }}
                          className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                          aria-label="View article"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {onGenerate && item.status === "pending" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onGenerate(item);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#ff4500] to-[#ff6b35] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-md"
                            title="Generate AI Article from this content"
                          >
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span className="hidden sm:inline">Generate</span>
                          </button>
                        )}
                        {item.status === "processing" && (
                          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-100 text-blue-700 rounded-xl text-xs sm:text-sm font-semibold">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Processing...</span>
                          </div>
                        )}
                        {item.status === "generated" && (
                          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-100 text-green-700 rounded-xl text-xs sm:text-sm font-semibold">
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline">Completed</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={colSpan}
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
    </div>
  );
}