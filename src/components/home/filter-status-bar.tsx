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

  const isVoiceJeju = domain.includes('voicejeju');
  const isSkyBluePrime = domain.includes('skyblueprime');

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
    <div className={`mb-6 flex items-center justify-between ${isVoiceJeju ? 'bg-white border-2 border-black rounded-none shadow-sm' : 'bg-gray-50 border border-gray-200 rounded-lg'} p-4`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-sm font-bold uppercase tracking-widest text-gray-900 ${isVoiceJeju ? 'font-inter text-[10px]' : 'font-medium'}`}>
          Active Filters:
        </span>
        {categoryLabel && (
          <span
            className={`px-3 py-1 text-white ${isVoiceJeju ? 'rounded-none uppercase tracking-widest font-black text-[9px]' : 'rounded-full text-xs font-medium'}`}
            style={{ backgroundColor: domainColor.hex }}
          >
            Category: {categoryLabel}
          </span>
        )}
        {searchQuery && (
          <span
            className={`px-3 py-1 text-white ${isVoiceJeju ? 'rounded-none uppercase tracking-widest font-black text-[9px]' : 'rounded-full text-xs font-medium'}`}
            style={{ backgroundColor: domainColor.hex }}
          >
            Search: &quot;{searchQuery}&quot;
          </span>
        )}
        <span className={`text-sm text-gray-600 ${isVoiceJeju ? 'font-bold uppercase text-[9px] tracking-widest' : ''}`}>
          ({resultCount} {resultCount === 1 ? "result" : "results"})
        </span>
      </div>
      <button
        type="button"
        onClick={clearFilters}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all border ${isVoiceJeju ? 'rounded-none border-black hover:bg-black hover:text-white uppercase tracking-widest text-[10px]' : 'rounded-lg border-transparent text-gray-700'}`}
        onMouseEnter={(e) => {
          if (!isVoiceJeju) {
            e.currentTarget.style.backgroundColor = domainColor.hex;
            e.currentTarget.style.color = 'white';
          }
        }}
        onMouseLeave={(e) => {
          if (!isVoiceJeju) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#374151';
          }
        }}
      >
        <X className="w-4 h-4" />
        Clear Filters
      </button>
    </div>
  );
}
