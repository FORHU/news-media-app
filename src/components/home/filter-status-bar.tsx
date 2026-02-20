"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface FilterStatusBarProps {
  searchQuery: string | null;
  categoryName?: string | null;
  resultCount: number;
}

export function FilterStatusBar({
  searchQuery,
  categoryName,
  resultCount,
}: FilterStatusBarProps) {
  const router = useRouter();

  const clearFilters = () => {
    router.push("/");
  };

  return (
    <div className="mb-6 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700">
          Active Filters:
        </span>
        {categoryName && (
          <span className="px-3 py-1 bg-[#ff4500] text-white rounded-full text-xs font-medium">
            Category: {categoryName}
          </span>
        )}
        {searchQuery && (
          <span className="px-3 py-1 bg-[#ff4500] text-white rounded-full text-xs font-medium">
            Search: &quot;{searchQuery}&quot;
          </span>
        )}
        <span className="text-sm text-gray-600">
          ({resultCount} {resultCount === 1 ? "result" : "results"})
        </span>
      </div>
      <button
        type="button"
        onClick={clearFilters}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#ff4500] hover:bg-gray-100 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
        Clear Filters
      </button>
    </div>
  );
}
