"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, User, X } from "lucide-react";
import { getCoreCategories, HOME_CATEGORY_LABEL } from "@/config/categories";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "@/components/search/SearchDropdown";

interface SkyBluePrimeHeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export default function SkyBluePrimeHeader({ onOpenNewsletter }: SkyBluePrimeHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { suggestions, isSearching, showSuggestions, hideSuggestions } = useSearchSuggestions(query);

  const categories = getCoreCategories("skyblueprime.com");
  const activeCategory = searchParams.get("category") ?? "";
  const isHome = pathname === "/" && !activeCategory;

  const isCatActive = (cat: string) =>
    activeCategory.toLowerCase() === cat.toLowerCase();

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsMenuOpen(false); setIsSearchOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
      setIsMenuOpen(false);
      hideSuggestions();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-sky-950 relative">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Side: Menu + Logo */}
          <div className="flex items-center gap-3.5 xl:gap-6 h-full">
            <button
              type="button"
              onClick={() => setIsMenuOpen((o) => !o)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-sky-950 hover:text-sky-700 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
              aria-controls="skyblueprime-drawer"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link href="/" className="flex items-center shrink-0 h-full">
              {/* WIRED style bold block letters */}
              <span className="text-2xl sm:text-3xl font-black tracking-tighter text-white bg-sky-950 px-2 py-0.5 leading-none">
                SKY<span className="text-sky-400">BLUE</span>PRIME
              </span>
            </Link>
          </div>

          {/* Right Side: Icons + Subscribe */}
          <div className="flex items-center gap-3 xl:gap-6 h-full">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-sky-950 hover:text-sky-600 transition-colors"
              aria-label="Toggle search"
              aria-expanded={isSearchOpen}
            >
              <Search size={20} />
            </button>

            <Link
              href="/admin/login"
              className="p-1 text-sky-950 hover:text-sky-600 transition-colors hidden sm:block"
              aria-label="Admin Portal"
            >
              <User size={20} />
            </Link>

            {onOpenNewsletter && (
              <button
                type="button"
                onClick={onOpenNewsletter}
                className="hidden md:block text-xs font-bold uppercase tracking-widest text-sky-950 hover:text-sky-600 transition-colors"
              >
                Newsletters
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Sub-Header Categories Bar */}
      <div className="bg-sky-50/50 border-b border-sky-100 hidden lg:block overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-start xl:justify-center gap-6 xl:gap-8 text-[11px] font-extrabold uppercase tracking-widest">
          <Link
            href="/"
            className={`whitespace-nowrap shrink-0 transition-colors ${isHome ? "text-sky-600 underline underline-offset-4" : "text-sky-950 hover:text-sky-600"}`}
          >
            Home
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={categoryHref(cat)}
              className={`whitespace-nowrap shrink-0 transition-colors ${isCatActive(cat) ? "text-sky-600 underline underline-offset-4" : "text-sky-950 hover:text-sky-600"}`}
              aria-current={isCatActive(cat) ? "page" : undefined}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-sky-100 shadow-md py-4 px-4 z-40">
          <div className="max-w-[1600px] mx-auto">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={hideSuggestions}
                placeholder="Search stories, topics, or authors..."
                className="w-full pl-12 pr-4 py-3 rounded-none border-b-2 border-sky-200 bg-transparent text-lg text-sky-950 placeholder:text-sky-300 focus:outline-none focus:border-sky-600 transition-colors"
                autoFocus
              />
              {showSuggestions && (
                <SearchDropdown
                  query={query}
                  suggestions={suggestions}
                  isSearching={isSearching}
                  theme="skyblueprime"
                  onSelect={() => { hideSuggestions(); setIsSearchOpen(false); }}
                />
              )}
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Drawer Menu */}
      <div
        className={`fixed inset-0 bg-sky-950/40 z-[60] transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      <div
        id="skyblueprime-drawer"
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        className={`fixed top-0 left-0 h-full w-80 max-w-[80vw] bg-sky-950 text-white z-[70] shadow-2xl transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-sky-800">
          <span className="text-xl font-black tracking-tighter text-white bg-sky-900 px-2 py-0.5 leading-none">
            SKY<span className="text-sky-400">BLUE</span>PRIME
          </span>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-sky-300 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-8 space-y-6">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-bold uppercase tracking-widest transition-colors ${isHome ? "text-sky-400" : "hover:text-sky-400"}`}>
            {HOME_CATEGORY_LABEL}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={categoryHref(cat)}
              onClick={() => setIsMenuOpen(false)}
              aria-current={isCatActive(cat) ? "page" : undefined}
              className={`block text-sm font-bold uppercase tracking-widest transition-colors ${isCatActive(cat) ? "text-sky-400" : "hover:text-sky-400"}`}
            >
              {cat}
            </Link>
          ))}
          
          <div className="pt-6 mt-6 border-t border-sky-800 flex flex-col gap-6">
             {onOpenNewsletter && (
              <button
                type="button"
                onClick={() => {
                  onOpenNewsletter();
                  setIsMenuOpen(false);
                }}
                className="text-left text-sm font-bold uppercase tracking-widest text-sky-400 hover:text-white transition-colors"
              >
                Newsletters
              </button>
            )}
            <Link
              href="/admin/login"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-bold uppercase tracking-widest text-sky-400 hover:text-white transition-colors sm:hidden"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
