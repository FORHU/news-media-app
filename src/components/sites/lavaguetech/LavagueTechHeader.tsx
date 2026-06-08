"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, X, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { getCoreCategories, HOME_CATEGORY_LABEL, normalizeCategoryKey } from "@/config/categories";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import dynamic from "next/dynamic";

const LavagueTechSidebar = dynamic(() => import("./LavagueTechSidebar"), { ssr: false });

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(cat: string) {
  return `/search?category=${encodeURIComponent(cat)}`;
}

export default function LavagueTechHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const { suggestions, isSearching, showSuggestions, hideSuggestions } = useSearchSuggestions(query);

  const activeCategory = searchParams.get("category") ?? "";
  const isHome = pathname === "/" && !activeCategory;
  const isCatActive = (cat: string) => activeCategory.toLowerCase() === cat.toLowerCase();

  const coreCategories = getCoreCategories("lavaguetech.com");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const coreCategoryKeys = new Set(coreCategories.map(normalizeCategoryKey));

  const categoryLinks = [
    { name: HOME_CATEGORY_LABEL, link: "/" },
    ...coreCategories.map((name) => ({ name, link: categoryHref(name) })),
  ];

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (dir: "left" | "right") =>
    navRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    const t = setTimeout(checkScroll, 100);
    return () => {
      nav.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(t);
    };
  }, [categories]);

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsSidebarOpen(false); setIsMobileSearchOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      hideSuggestions();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex flex-col bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">

        {/* ── Top bar ──────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 w-full flex items-center justify-between gap-4 py-3">

          {/* Left: menu + logo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="p-2 text-gray-600 hover:text-blue-700 transition-colors"
            >
              <Menu size={22} />
            </button>
            <Link href="/" className={`${isMobileSearchOpen ? "hidden md:block" : "block"} shrink-0`}>
              <div className="relative h-10 w-44 sm:w-52">
                <Image
                  src="/Logo/LAVAGUETECH.png"
                  alt="LavagueTech"
                  fill
                  className="object-contain object-left"
                  priority
                  sizes="220px"
                />
              </div>
            </Link>
          </div>

          {/* Center: search */}
          <div className={`flex-1 flex justify-center items-center ${isMobileSearchOpen ? "flex" : "hidden md:flex"}`}>
            <form onSubmit={handleSearch} className="relative w-full max-w-xs">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={hideSuggestions}
                placeholder="SEARCH..."
                className="w-full bg-white border border-gray-300 focus:border-blue-600 rounded-full px-9 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-800 placeholder:text-gray-400 outline-none transition-colors"
              />
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {isMobileSearchOpen && (
                <button type="button" onClick={() => setIsMobileSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 md:hidden">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
              {showSuggestions && (
                <SearchDropdown query={query} suggestions={suggestions} isSearching={isSearching} theme="light" onSelect={hideSuggestions} />
              )}
            </form>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {!isMobileSearchOpen && (
              <button onClick={() => setIsMobileSearchOpen(true)} className="md:hidden text-gray-600 p-2" aria-label="Search">
                <Search size={20} />
              </button>
            )}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onOpenNewsletter}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Subscribe
              </button>
              <Link href="/admin/dashboard" className="text-gray-400 hover:text-blue-700 transition-colors" title="Admin">
                <User size={17} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Category nav bar ─────────────────────────── */}
        <div className="hidden md:block bg-gray-50 border-t border-gray-200 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center relative">

            {/* Left arrow */}
            <div className={`absolute left-0 top-0 bottom-0 z-10 flex items-center transition-opacity ${showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent w-12" />
              <button onClick={() => scroll("left")} className="relative ml-1 p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-full transition-colors">
                <ChevronLeft size={14} strokeWidth={2.5} />
              </button>
            </div>

            <nav
              ref={navRef}
              className="flex items-center gap-7 text-[10px] font-bold uppercase tracking-widest text-gray-500 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap flex-1 py-1"
            >
              <Link href="/" className={`transition-colors whitespace-nowrap border-b-2 pb-0.5 ${isHome ? "text-blue-700 border-blue-700" : "border-transparent hover:text-blue-600 hover:border-blue-300"}`}>
                Latest News
              </Link>
              {coreCategories.map((cat) => (
                <Link
                  key={cat}
                  href={categoryHref(cat)}
                  className={`transition-colors whitespace-nowrap border-b-2 pb-0.5 ${isCatActive(cat) ? "text-blue-700 border-blue-700" : "border-transparent hover:text-blue-600 hover:border-blue-300"}`}
                >
                  {cat}
                </Link>
              ))}
            </nav>

            {/* Right arrow */}
            <div className={`absolute right-0 top-0 bottom-0 z-10 flex items-center transition-opacity ${showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="absolute inset-0 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent w-12" />
              <button onClick={() => scroll("right")} className="relative mr-1 p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-full transition-colors">
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <LavagueTechSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenNewsletter={onOpenNewsletter}
        categoryLinks={categoryLinks}
        activeCategory={activeCategory}
        isHome={isHome}
      />
    </>
  );
}
