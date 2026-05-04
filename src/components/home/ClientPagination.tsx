"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDomainColor } from "@/lib/domainColors";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  domain: string;
}

export function ClientPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  startIndex,
  endIndex,
  domain,
}: ClientPaginationProps) {
  const domainColor = getDomainColor(domain);

  if (totalItems === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm text-gray-500">
          {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-none transition-colors ${
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
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-none transition-colors ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {[10, 15, 20]
            .filter((count) => {
              if (count === 20) return totalItems > 15;
              if (count === 15) return totalItems > 10;
              return true;
            })

            .map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => {
                  onItemsPerPageChange(count);
                  onPageChange(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-none transition-colors ${
                  itemsPerPage === count
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={itemsPerPage === count ? { backgroundColor: domainColor.hex } : {}}
              >
                {count}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
