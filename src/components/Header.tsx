"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Menu, Mail, User, Loader2 } from "lucide-react";
import ContactEmailButton from "@/components/ContactEmailButton";
import { SideBar } from "./SideBar";
import { articlesApi } from "@/lib/api";
import type { Article } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

function HeaderContent({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const q = searchParams.get("search") ?? "";
    setQuery(q);
  }, [searchParams]);

  // Handle live suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowSuggestions(true);
      try {
        const results = await articlesApi.getArticles({ limit: 5, search: query });
        setSuggestions(results);
      } catch (err) {
        console.error("Suggestions error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  };

  return (
    <header className="sticky top-0 z-[60] bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 md:h-16 gap-2 sm:gap-4">
          {/* Left: Hamburger + Search Icon (Mobile) / Search Form (Desktop) */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Search */}
            <div className="hidden md:block flex-1 max-w-[280px] relative search-container">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim() && setShowSuggestions(true)}
                    placeholder="Search articles..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#ff4500] focus:ring-2 focus:ring-[#ff4500]/20 outline-none"
                  />
                </div>
              </form>

              {/* Desktop Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {isSearching ? (
                      <div className="p-4 flex justify-center">
                        <Loader2 className="w-5 h-5 text-[#ff4500] animate-spin" />
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto py-2">
                        {suggestions.map((article) => (
                          <Link
                            key={article.id}
                            href={`/article/${article.slug ?? article.id}`}
                            onClick={() => {
                              setQuery(article.title);
                              setShowSuggestions(false);
                            }}
                            className="flex flex-col px-4 py-2 hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50"
                          >
                            <span className="text-sm font-semibold text-gray-900 line-clamp-1">{article.title}</span>
                            {normalizeCategoryName(article.category?.categoryName) ? (
                              <span className="text-xs text-[#ff4500] uppercase font-bold tracking-wider">
                                {normalizeCategoryName(article.category?.categoryName)}
                              </span>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-gray-500 text-center italic">No articles found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Center Column: NewsIcon logo */}
          <div className="flex-none flex justify-center px-2">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-[#FF4500] tracking-tight shrink-0 whitespace-nowrap"
            >
              NEWSICONS
            </Link>
          </div>

          {/* Right Column: NEWSLETTER + Profile */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 justify-end min-w-0">
            <button
              type="button"
              onClick={() => onOpenNewsletter?.()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-black hover:bg-[#ff4500] transition-colors shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">NEWSLETTER</span>
            </button>
            <ContactEmailButton
              buttonClassName="p-2 text-gray-600 hover:text-[#ff4500] transition-colors shrink-0"
              iconClassName="w-6 h-6"
            />
            <Link
              href="/admin/dashboard"
              className="p-2 text-gray-600 hover:text-[#ff4500] transition-colors shrink-0"
              aria-label="Profile"
            >
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {isSearchOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white animate-in slide-in-from-top duration-200 search-container overflow-visible">
            <form onSubmit={handleSearch} className="px-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  autoFocus
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.trim() && setShowSuggestions(true)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#ff4500] focus:ring-2 focus:ring-[#ff4500]/20 outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full py-2 bg-[#ff4500] text-white rounded-lg font-medium text-sm"
              >
                Search
              </button>
            </form>

            {/* Mobile Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 bg-white border-t border-gray-50 overflow-hidden"
                >
                  {isSearching ? (
                    <div className="p-4 flex justify-center">
                      <Loader2 className="w-5 h-5 text-[#ff4500] animate-spin" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="max-h-[250px] overflow-y-auto px-2 pb-2">
                      {suggestions.map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.slug ?? article.id}`}
                          onClick={() => {
                            setQuery(article.title);
                            setShowSuggestions(false);
                            setIsSearchOpen(false);
                          }}
                          className="flex flex-col py-3 border-b last:border-0 border-gray-50 active:bg-gray-50"
                        >
                          <span className="text-sm font-semibold text-gray-900 line-clamp-2">{article.title}</span>
                          {normalizeCategoryName(article.category?.categoryName) ? (
                            <span className="text-[10px] text-[#ff4500] uppercase font-bold tracking-widest">
                              {normalizeCategoryName(article.category?.categoryName)}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-gray-500 text-center italic">No results found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <SideBar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenNewsletter={onOpenNewsletter}
        />
      </div>
    </header>
  );
}

function HeaderFallback({ onOpenNewsletter }: HeaderProps) {
  return (
    <header className="sticky top-0 z-[60] bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 md:h-16 gap-2 sm:gap-4">
          {/* Left: Hamburger + Search Icon (Mobile) / Search Form (Desktop) */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 text-gray-600 rounded-lg shrink-0">
              <Menu className="w-5 h-5" />
            </div>

            {/* Desktop Search Skeleton */}
            <div className="hidden md:block flex-1 max-w-[280px] relative search-container">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search articles..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-400 outline-none"
                  disabled
                />
              </div>
            </div>

            {/* Mobile Search Icon Skeleton */}
            <div className="md:hidden p-2 text-gray-600 rounded-lg shrink-0">
              <Search className="w-5 h-5" />
            </div>
          </div>

          {/* Center Column: NewsIcon logo */}
          <div className="flex-none flex justify-center px-2">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-[#FF4500] tracking-tight shrink-0 whitespace-nowrap"
            >
              NEWSICONS
            </Link>
          </div>

          {/* Right Column: NEWSLETTER + Profile */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 justify-end min-w-0">
            <button
              type="button"
              onClick={() => onOpenNewsletter?.()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-black shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">NEWSLETTER</span>
            </button>
            <div className="p-2 text-gray-600 rounded-lg shrink-0">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Header({ onOpenNewsletter }: HeaderProps) {
  return (
    <Suspense fallback={<HeaderFallback onOpenNewsletter={onOpenNewsletter} />}>
      <HeaderContent onOpenNewsletter={onOpenNewsletter} />
    </Suspense>
  );
}
