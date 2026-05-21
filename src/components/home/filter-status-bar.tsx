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
  const isJejuJapan = domain.includes("jejujapan");
  const isJejuQQ = domain.includes("jejuqq");

  const clearAllFilters = () => {
    router.push("/search");
  };

  const clearCategoryOnly = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  };

  const clearSearchOnly = () => {
    const params = new URLSearchParams();
    if (categoryName) params.set("category", categoryName);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
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
            onClick={clearAllFilters}
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
              <span className="flex items-center gap-1.5 bg-sky-950 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {categoryLabel}
                <button type="button" onClick={clearCategoryOnly} aria-label="Remove category filter" className="hover:text-sky-300 transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="flex items-center gap-1.5 bg-sky-950 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={clearSearchOnly} aria-label="Remove search filter" className="hover:text-sky-300 transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-widest">
              {resultCount} {resultCount === 1 ? "result" : "results"}
            </span>
          </div>
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-sky-950 border border-sky-950 hover:bg-sky-950 hover:text-white transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>
      </div>
    );
  }

  if (isJejuJapan) {
    if (!searchQuery && !categoryName) return null;

    return (
      <div className="mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              FILTERS:
            </span>
            {categoryLabel && (
              <span className="flex items-center gap-1.5 bg-[#bc002d] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {categoryLabel}
                <button
                  type="button"
                  onClick={clearCategoryOnly}
                  aria-label="Remove category filter"
                  className="hover:text-red-200 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="flex items-center gap-1.5 bg-[#bc002d] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={clearSearchOnly}
                  aria-label="Remove search filter"
                  className="hover:text-red-200 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {resultCount} {resultCount === 1 ? "result" : "results"}
            </span>
          </div>
          {(searchQuery || categoryName) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#bc002d] border border-[#bc002d] hover:bg-[#bc002d] hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isJejuQQ) {
    if (!searchQuery && !categoryName) return null;

    return (
      <div className="mb-6 border-t-4 border-[#dc2626] pt-4 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#dc2626] block mb-1.5 font-serif">
              Results For
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {categoryLabel && (
                <button
                  type="button"
                  onClick={clearCategoryOnly}
                  aria-label="Remove category filter"
                  className="flex items-center gap-2 text-[20px] font-serif font-bold text-gray-900 hover:text-[#dc2626] transition-colors group leading-tight"
                >
                  {categoryLabel}
                  <X className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#dc2626] flex-shrink-0" />
                </button>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearchOnly}
                  aria-label="Remove search filter"
                  className="flex items-center gap-2 text-[20px] font-serif font-bold text-gray-900 hover:text-[#dc2626] transition-colors group leading-tight"
                >
                  &ldquo;{searchQuery}&rdquo;
                  <X className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#dc2626] flex-shrink-0" />
                </button>
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5 block">
              {resultCount} {resultCount === 1 ? "article" : "articles"}
            </span>
          </div>
          {(searchQuery || categoryName) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex-shrink-0 mt-1 text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 hover:text-[#dc2626] transition-colors"
            >
              Clear All
            </button>
          )}
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
            className="flex items-center gap-1.5 px-3 py-1 text-white rounded-full text-xs font-medium"
            style={{ backgroundColor: domainColor.hex }}
          >
            Category: {categoryLabel}
            <button type="button" onClick={clearCategoryOnly} aria-label="Remove category filter" className="hover:opacity-70 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {searchQuery && (
          <span
            className="flex items-center gap-1.5 px-3 py-1 text-white rounded-full text-xs font-medium"
            style={{ backgroundColor: domainColor.hex }}
          >
            Search: &quot;{searchQuery}&quot;
            <button type="button" onClick={clearSearchOnly} aria-label="Remove search filter" className="hover:opacity-70 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        <span className="text-sm text-gray-600">
          ({resultCount} {resultCount === 1 ? "result" : "results"})
        </span>
      </div>
      <button
        type="button"
        onClick={clearAllFilters}
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
        Clear All
      </button>
    </div>
  );
}
