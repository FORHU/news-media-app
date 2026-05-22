"use client"; // VoiceJeju Header Component

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, User, X, ChevronDown, ChevronLeft, ChevronRight, Globe, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { articlesApi } from "@/lib/api";
import { getCoreCategories, HOME_CATEGORY_LABEL, normalizeCategoryKey } from "@/config/categories";
import type { Article } from "@/lib/types";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "@/components/search/SearchDropdown";

const VoiceJejuSidebar = dynamic<{
  isOpen: boolean;
  onClose: () => void;
  onOpenNewsletter?: () => void;
  categoryLinks: { name: string; link: string }[];
  overflowCategories: string[];
  categoryHref: (name: string) => string;
}>(() => import("./VoiceJejuSidebar").then(m => m.VoiceJejuSidebar), { ssr: false });

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export function VoiceJejuHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeCategory = searchParams.get("category") ?? "";
  const isHome = pathname === "/" && !activeCategory;
  const isCatActive = (cat: string) => activeCategory.toLowerCase() === cat.toLowerCase();
  const navRef = useRef<HTMLDivElement>(null);
  const { suggestions, isSearching, showSuggestions, hideSuggestions } = useSearchSuggestions(query);
  const [weather, setWeather] = useState({ temp: "18°C", condition: "Clear" });
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    // Fetch live weather for Jeju using JSON format for safety
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://wttr.in/Jeju?format=j1");
        if (res.ok) {
          const data = await res.json();
          const current = data.current_condition?.[0];
          if (current) {
            setWeather({ 
              temp: `${current.temp_C}°C`, 
              condition: current.weatherDesc?.[0]?.value || "Clear" 
            });
          }
        }
      } catch (err) {
        console.error("Weather fetch failed:", err);
      }
    };
    fetchWeather();
  }, []);

  const getWeatherIcon = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle")) return <CloudRain size={12} className="text-gray-400" />;
    if (c.includes("snow")) return <CloudSnow size={12} className="text-gray-400" />;
    if (c.includes("thunder") || c.includes("storm")) return <CloudLightning size={12} className="text-gray-400" />;
    if (c.includes("cloud") || c.includes("overcast")) return <Cloud size={12} className="text-gray-400" />;
    if (c.includes("wind") || c.includes("gale")) return <Wind size={12} className="text-gray-400" />;
    return <Sun size={12} className="text-gray-400" />;
  };

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = 300;
      navRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const nav = navRef.current;
    if (nav) {
      nav.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      const timer = setTimeout(checkScroll, 100);
      return () => {
        nav.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [categories]);

  const coreCategories = getCoreCategories("voicejeju.com");
  const coreCategoryKeys = new Set(
    coreCategories.map((category) => normalizeCategoryKey(category))
  );
  
  const overflowCategories = Array.from(
    categories.reduce((acc, cat) => {
      const name = cat.name.trim();
      const key = normalizeCategoryKey(name);
      if (!name || !key) return acc;
      if (key === normalizeCategoryKey(HOME_CATEGORY_LABEL)) return acc;
      if (coreCategoryKeys.has(key)) return acc;
      if (!acc.has(key)) acc.set(key, name);
      return acc;
    }, new Map<string, string>())
  ).map(([, name]) => name);

  const categoryLinks = [
    { name: HOME_CATEGORY_LABEL, link: "/" },
    ...coreCategories.map((categoryName) => ({
      name: categoryName,
      link: categoryHref(categoryName),
    })),
  ];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsSidebarOpen(false); setIsSearchOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
      hideSuggestions();
    }
  };

  return (
    <>
      <header className="w-full bg-white flex flex-col font-inter">
        {/* Row 1: Top Bar */}
        <div className="border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-8 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <div className="flex items-center gap-4">
              <span>{today}</span>
              <span className="hidden sm:inline border-l border-gray-200 pl-4">Today's Paper</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {getWeatherIcon(weather.condition)}
                <span>{weather.temp} | Jeju City, KR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Logo Bar */}
        <div className="border-b border-black py-2 lg:py-3">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center w-1/3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={isSidebarOpen}
                aria-haspopup="dialog"
              >
                <Menu size={24} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex justify-center w-1/3">
              <Link href="/" className="transition-opacity hover:opacity-90">
                <h1 className="text-5xl lg:text-7xl font-normal text-black font-voltaire tracking-tight uppercase">VoiceJeju</h1>
              </Link>
            </div>

            <div className="flex items-center justify-end gap-2 lg:gap-4 w-1/3">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                aria-label={isSearchOpen ? "Close search" : "Open search"}
                aria-expanded={isSearchOpen}
              >
                <Search size={20} strokeWidth={1.5} />
              </button>
              <Link href="/admin/dashboard" className="p-2 hover:bg-gray-50 rounded-full transition-colors" aria-label="Admin Dashboard">
                <User size={20} strokeWidth={1.5} />
              </Link>
              <button 
                onClick={onOpenNewsletter}
                className="hidden sm:block px-5 py-2 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Main Navigation (Black Bar) */}
        <div className="bg-black text-white relative hidden lg:block">
          <div className="max-w-[1440px] mx-auto relative px-4 py-1.5 flex items-center justify-center">
             <nav
               ref={navRef}
               className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 w-full text-[11px] font-bold uppercase tracking-[0.15em] text-white/80"
             >
                <Link
                  href="/"
                  aria-current={isHome ? "page" : undefined}
                  className={`transition-colors py-2 ${isHome ? "text-white underline underline-offset-4" : "hover:text-white"}`}
                >
                  Home
                </Link>
                {coreCategories.map((cat) => (
                  <Link
                    key={cat}
                    href={categoryHref(cat)}
                    aria-current={isCatActive(cat) ? "page" : undefined}
                    className={`transition-colors py-2 ${isCatActive(cat) ? "text-white underline underline-offset-4" : "hover:text-white"}`}
                  >
                    {cat}
                  </Link>
                ))}
                {overflowCategories.length > 0 && (
                  <div className="relative group cursor-pointer flex items-center gap-1 hover:text-white py-2 hidden lg:flex">
                     MORE <ChevronDown size={12} />
                     <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 hidden group-hover:block z-50">
                        <div className="bg-black border border-gray-800 shadow-2xl p-6 grid grid-cols-2 gap-x-8 gap-y-4 min-w-[350px]">
                           {overflowCategories.map((cat) => (
                             <Link 
                                key={cat} 
                                href={categoryHref(cat)} 
                                className="text-white/70 hover:text-white text-[11px] transition-colors uppercase tracking-wider"
                             >
                                {cat}
                             </Link>
                           ))}
                        </div>
                     </div>
                  </div>
                )}
             </nav>
          </div>
        </div>

        {/* Search Overlay */}
        {isSearchOpen && (
          <div className="absolute inset-0 bg-white z-[60] flex items-center justify-center px-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative w-full max-w-2xl">
              <form onSubmit={handleSearch} className="flex items-center gap-4 border-b-2 border-black pb-2">
                <Search className="text-black" size={20} strokeWidth={2} />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={hideSuggestions}
                  placeholder="SEARCH STORIES..."
                  className="flex-1 bg-transparent border-none outline-none text-xl lg:text-2xl font-normal font-voltaire placeholder:text-gray-300 uppercase tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                  aria-label="Close search overlay"
                >
                  <X size={20} />
                </button>
              </form>
              {showSuggestions && (
                <SearchDropdown
                  query={query}
                  suggestions={suggestions}
                  isSearching={isSearching}
                  theme="voicejeju"
                  onSelect={() => { hideSuggestions(); setIsSearchOpen(false); }}
                />
              )}
            </div>
          </div>
        )}
      </header>

      <VoiceJejuSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenNewsletter={onOpenNewsletter}
        categoryLinks={categoryLinks}
        overflowCategories={overflowCategories}
        categoryHref={categoryHref}
      />
    </>
  );
}
