"use client"; // VoiceJeju Header Component

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, User, X, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from "lucide-react";
import ContactEmailButton from "@/components/ContactEmailButton";
import { useRef } from "react";
import { getCoreCategories, getHomeCategoryLabel } from "@/config/categories";
import dynamic from "next/dynamic";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "@/components/search/SearchDropdown";

const VoiceJejuSidebar = dynamic<{
  isOpen: boolean;
  onClose: () => void;
  onOpenNewsletter?: () => void;
  categoryLinks: { name: string; link: string }[];
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
    // No-op: retained as the registered scroll/resize listener below.
  };

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
  }, []);

  const coreCategories = getCoreCategories("voicejeju.com");
  const homeLabel = getHomeCategoryLabel("voicejeju.com");

  const categoryLinks = [
    { name: homeLabel, link: "/" },
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
              <span className="hidden sm:inline border-l border-gray-200 pl-4">Today&apos;s Paper</span>
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

            {/* Desktop: inline search expand */}
            <div className={`hidden lg:flex items-center justify-end gap-4 transition-all duration-200 ${isSearchOpen ? 'flex-1' : 'w-1/3'}`}>
              {isSearchOpen ? (
                <div className="relative w-full">
                  <form onSubmit={handleSearch} className="flex items-center gap-3 border-b-2 border-black pb-1">
                    <Search size={16} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onBlur={hideSuggestions}
                      placeholder="Search stories..."
                      className="flex-1 bg-transparent border-none outline-none text-base font-normal min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => { setIsSearchOpen(false); setQuery(""); hideSuggestions(); }}
                      className="p-1 hover:bg-gray-50 rounded-full transition-colors flex-shrink-0"
                      aria-label="Close search"
                    >
                      <X size={16} />
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
              ) : (
                <>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                    aria-label="Open search"
                    aria-expanded={false}
                  >
                    <Search size={20} strokeWidth={1.5} />
                  </button>
                  <ContactEmailButton
                    buttonClassName="p-2 hover:bg-gray-50 rounded-full transition-colors"
                    iconSize={20}
                    strokeWidth={1.5}
                  />
                  <Link href="/admin/dashboard" className="p-2 hover:bg-gray-50 rounded-full transition-colors" aria-label="Admin Dashboard">
                    <User size={20} strokeWidth={1.5} />
                  </Link>
                  <button
                    onClick={onOpenNewsletter}
                    className="hidden sm:block px-5 py-2 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm"
                  >
                    Subscribe
                  </button>
                </>
              )}
            </div>

            {/* Mobile: icon buttons only */}
            <div className="flex lg:hidden items-center justify-end gap-2 w-1/3">
              {isSearchOpen ? (
                <button
                  type="button"
                  onClick={() => { setIsSearchOpen(false); setQuery(""); hideSuggestions(); }}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                  aria-label="Close search"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                    aria-label="Open search"
                    aria-expanded={false}
                  >
                    <Search size={20} strokeWidth={1.5} />
                  </button>
                  <Link href="/admin/dashboard" className="p-2 hover:bg-gray-50 rounded-full transition-colors" aria-label="Admin Dashboard">
                    <User size={20} strokeWidth={1.5} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Panel — slides in below logo bar */}
        {isSearchOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white relative">
            <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-3">
              <Search size={16} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={hideSuggestions}
                placeholder="Search stories..."
                className="flex-1 bg-transparent border-none outline-none text-base font-normal min-w-0"
              />
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
        )}

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
                  {homeLabel}
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
             </nav>
          </div>
        </div>

      </header>

      <VoiceJejuSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenNewsletter={onOpenNewsletter}
        categoryLinks={categoryLinks}
        categoryHref={categoryHref}
      />
    </>
  );
}
