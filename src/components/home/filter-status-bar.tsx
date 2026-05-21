"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
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
  const [inputValue, setInputValue] = useState(searchQuery || "");
  const categoryLabel = normalizeCategoryName(categoryName) || categoryName;
  const domainColor = getDomainColor(domain);
  const isVoiceJeju = domain.includes("voicejeju");
  const isSkyBluePrime = domain.includes("skyblueprime");

  const clearFilters = () => {
    router.push("/");
  };

  const handleVoiceJejuSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (inputValue.trim()) params.set("search", inputValue.trim());
    if (categoryName) params.set("category", categoryName);
    router.push(`/search?${params.toString()}`);
  };

  if (isVoiceJeju) {
    return (
      <form
        onSubmit={handleVoiceJejuSearch}
        className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-black"
      >
        <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Refine search…"
          className="flex-1 min-w-0 bg-transparent text-sm font-inter text-black placeholder:text-gray-500 focus:outline-none py-1"
        />
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700 whitespace-nowrap flex-shrink-0">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </span>
        {(searchQuery || categoryName) && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.4em] text-black border-2 border-black px-3 py-1.5 hover:bg-black hover:text-white transition-all flex-shrink-0"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </form>
    );
  }

  if (isSkyBluePrime) {
    return (
      <div className="mb-8 border-t-[4px] border-sky-950 pt-4 pb-4 border-b border-sky-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-widest text-sky-950">
              Active Filters:
            </span>
            {categoryLabel && (
              <span className="bg-sky-950 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {categoryLabel}
              </span>
            )}
            {searchQuery && (
              <span className="bg-sky-950 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                &ldquo;{searchQuery}&rdquo;
              </span>
            )}
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-widest">
              {resultCount} {resultCount === 1 ? "result" : "results"}
            </span>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-sky-950 border border-sky-950 hover:bg-sky-950 hover:text-white transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium uppercase tracking-widest text-gray-900">
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
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all border rounded-lg border-transparent text-gray-700"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = domainColor.hex;
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#374151";
        }}
      >
        <X className="w-4 h-4" />
        Clear Filters
      </button>
    </div>
  );
}
