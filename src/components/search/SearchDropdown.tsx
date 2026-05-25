"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Article } from "@/lib/types";

export type SearchTheme = "jejutime" | "jejuqq" | "voicejeju" | "jejujapan" | "skyblueprime";

interface SearchDropdownProps {
  query: string;
  suggestions: Article[];
  isSearching: boolean;
  theme: SearchTheme;
  onSelect: () => void;
}

const themes: Record<SearchTheme, {
  container: string;
  item: string;
  title: string;
  category: string;
  spinner: string;
  empty: string;
  seeAll: string;
  divider: string;
}> = {
  jejutime: {
    container: "bg-white border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-none",
    item: "hover:bg-blue-50",
    title: "text-slate-800 font-bold font-baskerville leading-snug group-hover:text-blue-600 transition-colors",
    category: "text-blue-500 font-bold uppercase tracking-widest",
    spinner: "text-blue-400",
    empty: "text-slate-400",
    seeAll: "text-blue-600 font-bold hover:text-blue-800 bg-blue-50 hover:bg-blue-100",
    divider: "border-slate-100",
  },
  jejuqq: {
    container: "bg-white border border-gray-200 shadow-xl rounded-none",
    item: "hover:bg-[#fdf2f2]",
    title: "text-gray-900 font-bold font-serif leading-snug group-hover:text-[#dc2626] transition-colors",
    category: "text-[#dc2626] font-bold font-serif uppercase tracking-widest",
    spinner: "text-[#dc2626]",
    empty: "text-gray-400",
    seeAll: "text-[#dc2626] font-bold font-serif hover:bg-[#fdf2f2]",
    divider: "border-gray-100",
  },
  voicejeju: {
    container: "bg-gray-900 border border-white/10 shadow-2xl rounded-none",
    item: "hover:bg-white/10",
    title: "text-white font-bold leading-snug group-hover:text-yellow-300 transition-colors",
    category: "text-yellow-400 font-bold uppercase tracking-widest",
    spinner: "text-yellow-400",
    empty: "text-white/50",
    seeAll: "text-yellow-300 font-bold hover:bg-white/10",
    divider: "border-white/10",
  },
  jejujapan: {
    container: "bg-white border border-gray-200 shadow-xl rounded-none",
    item: "hover:bg-red-50",
    title: "text-gray-900 font-bold leading-snug group-hover:text-red-600 transition-colors",
    category: "text-red-500 font-bold uppercase tracking-widest",
    spinner: "text-red-400",
    empty: "text-gray-400",
    seeAll: "text-red-600 font-bold hover:bg-red-50",
    divider: "border-gray-100",
  },
  skyblueprime: {
    container: "bg-white border border-sky-100 shadow-xl rounded-none",
    item: "hover:bg-sky-50",
    title: "text-sky-950 font-bold leading-snug group-hover:text-sky-600 transition-colors",
    category: "text-sky-500 font-bold uppercase tracking-widest",
    spinner: "text-sky-400",
    empty: "text-sky-300",
    seeAll: "text-sky-600 font-bold hover:bg-sky-50",
    divider: "border-sky-100",
  },
};

export function SearchDropdown({ query, suggestions, isSearching, theme, onSelect }: SearchDropdownProps) {
  const t = themes[theme];

  if (!query.trim()) return null;

  return (
    <div className={`absolute top-full left-0 right-0 z-[100] overflow-hidden mt-1 ${t.container}`}>
      {isSearching && suggestions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-4 px-4">
          <Loader2 className={`w-4 h-4 animate-spin ${t.spinner}`} />
          <span className={`text-[11px] font-bold uppercase tracking-widest ${t.spinner}`}>Searching…</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className={`py-4 px-4 text-center text-[12px] font-bold uppercase tracking-widest ${t.empty}`}>
          No results for &ldquo;{query}&rdquo;
        </div>
      ) : (
        <>
          {suggestions.map((article, i) => (
            <Link
              key={article.id}
              href={`/article/${article.slug || article.id}`}
              onClick={onSelect}
              className={`group flex items-center gap-3 px-4 py-3 transition-colors ${t.item} ${i > 0 ? `border-t ${t.divider}` : ""}`}
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-10 shrink-0 overflow-hidden bg-gray-100">
                {article.imageUrl ? (
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                {article.category?.categoryName && (
                  <span className={`text-[9px] block mb-0.5 ${t.category}`}>
                    {article.category.categoryName}
                  </span>
                )}
                <p className={`text-[13px] line-clamp-2 ${t.title}`}>{article.title}</p>
              </div>
            </Link>
          ))}

          {/* See all results */}
          <Link
            href={`/search?search=${encodeURIComponent(query)}`}
            onClick={onSelect}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-4 text-[11px] uppercase tracking-widest transition-colors border-t ${t.divider} ${t.seeAll}`}
          >
            See all results for &ldquo;{query}&rdquo; →
          </Link>
        </>
      )}
    </div>
  );
}
