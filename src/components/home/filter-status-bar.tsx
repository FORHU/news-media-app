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
        style={!isVoiceJeju ? { 
          // Keep old style for other sites
        } : {}}
        onMouseEnter={(e) => {
          if (!isVoiceJeju) {
            e.currentTarget.style.backgroundColor = domainColor.hex;
            e.currentTarget.style.color = 'white';
          }
        }}
        onMouseLeave={(e) => {
          if (!isVoiceJeju) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#374151'; // gray-700
          }
        }}
      >
        <X className="w-4 h-4" />
        Clear Filters
      </button>
    </div>
  );
}
