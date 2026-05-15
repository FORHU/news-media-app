"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, Mail, X } from "lucide-react";
import { getCoreCategories, HOME_CATEGORY_LABEL } from "@/config/categories";

interface SkyBluePrimeHeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export default function SkyBluePrimeHeader({ onOpenNewsletter }: SkyBluePrimeHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = getCoreCategories("skyblueprime.com");

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm">
      <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white text-[10px] font-semibold uppercase tracking-[0.2em]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <span>Sky Blue Prime</span>
          <span className="hidden sm:inline opacity-90">Premium news & insights</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="group shrink-0">
            <span className="block text-xl sm:text-2xl font-bold tracking-tight text-sky-950">
              Sky<span className="text-sky-500">Blue</span>Prime
            </span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-sky-600/80 font-medium">
              skyblueprime.com
            </span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stories..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-sky-200 bg-sky-50/50 text-sm text-sky-950 placeholder:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="md:hidden p-2 text-sky-600 hover:bg-sky-50 rounded-full"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            {onOpenNewsletter && (
              <button
                type="button"
                onClick={onOpenNewsletter}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-sky-600 hover:bg-sky-700 rounded-full transition-colors"
              >
                <Mail size={14} />
                Subscribe
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMenuOpen((o) => !o)}
              className="p-2 text-sky-700 hover:bg-sky-50 rounded-full lg:hidden"
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 pb-3 overflow-x-auto">
          <Link
            href="/"
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-md whitespace-nowrap"
          >
            {HOME_CATEGORY_LABEL}
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat}
              href={categoryHref(cat)}
              className="px-3 py-1.5 text-xs font-medium text-sky-600 hover:text-sky-900 hover:bg-sky-50 rounded-md whitespace-nowrap transition-colors"
            >
              {cat}
            </Link>
          ))}
        </nav>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-sky-100 bg-white px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-sky-200 bg-sky-50/50 text-sm"
            />
          </form>
          <div className="flex flex-wrap gap-2">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="px-3 py-1.5 text-xs font-semibold bg-sky-100 text-sky-800 rounded-full">
              Home
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={categoryHref(cat)}
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 rounded-full"
              >
                {cat}
              </Link>
            ))}
          </div>
          {onOpenNewsletter && (
            <button
              type="button"
              onClick={() => {
                onOpenNewsletter();
                setIsMenuOpen(false);
              }}
              className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-sky-600 rounded-full"
            >
              Subscribe to newsletter
            </button>
          )}
        </div>
      )}
    </header>
  );
}
