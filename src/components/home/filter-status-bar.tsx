"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import { getDomainColor } from "@/lib/domainColors";

interface FilterStatusBarProps {
  searchQuery: string | null;
  categoryName?: string | null;
  resultCount: number;
  domain: string;
}

export function FilterStatusBar({
  searchQuery,
  categoryName,
  resultCount,
  domain,
}: FilterStatusBarProps) {
  const router = useRouter();
  const categoryLabel = normalizeCategoryName(categoryName) || categoryName;

  const domainColor = getDomainColor(domain);

  const clearFilters = () => {
    router.push("/");
  };

  return (
    <div className="mb-6 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700">
          Active Filters:
        </span>
        {categoryLabel && (
          <span 
            className="px-3 py-1 text-white rounded-full text-xs font-medium"
            style={{ backgroundColor: domainColor.hex }}
          >
            Category: {categoryLabel}
          </span>
        )}
        {searchQuery && (
          <span 
            className="px-3 py-1 text-white rounded-full text-xs font-medium"
            style={{ backgroundColor: domainColor.hex }}
          >
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
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = domainColor.hex;
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#374151'; // gray-700
        }}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 rounded-lg transition-colors border border-transparent"
      >
        <X className="w-4 h-4" />
        Clear Filters
      </button>
    </div>
  );
}
