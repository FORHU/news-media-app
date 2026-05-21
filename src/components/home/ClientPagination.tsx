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
  const isVoiceJeju = domain.toLowerCase().includes("voicejeju");

  // If totalItems is less than or equal to the minimum itemsPerPage option (10),
  // pagination controls are completely redundant and confusing (e.g. 1-5 of 5, Page 1 of 1).
  // Hiding the entire bar keeps the UI clean and visual noise minimal.
  if (totalItems <= 10) return null;

  const handlePageChange = (page: number) => {
    onPageChange(page);
    setTimeout(() => {
      const element = document.getElementById("latest-stories");
      if (element) {
        element.scrollIntoView({ behavior: "auto" });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 80);
  };

  const handleItemsPerPageChange = (count: number) => {
    onItemsPerPageChange(count);
    onPageChange(1);
    setTimeout(() => {
      const element = document.getElementById("latest-stories");
      if (element) {
        element.scrollIntoView({ behavior: "auto" });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 80);
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full text-center sm:text-left">
        <div className={`text-sm text-gray-500 ${isVoiceJeju ? "font-voltaire tracking-wider uppercase" : ""}`}>
          {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-none transition-colors ${currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className={`px-3 text-sm text-gray-700 ${isVoiceJeju ? "font-voltaire tracking-wider uppercase text-base" : ""}`}>
            Page {currentPage} of {totalPages}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-none transition-colors ${currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mr-1 ${isVoiceJeju ? "font-voltaire tracking-[0.25em]" : ""}`}>
            Show:
          </span>
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
                onClick={() => handleItemsPerPageChange(count)}
                className={`px-2.5 py-1 text-xs font-medium rounded-none transition-colors ${itemsPerPage === count
                    ? "text-white shadow-sm font-semibold"
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
