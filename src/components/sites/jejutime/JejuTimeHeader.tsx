"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, User, X, ChevronLeft, ChevronRight } from "lucide-react";
import ContactEmailButton from "@/components/ContactEmailButton";
import { useRef } from "react";
import { getCoreCategories, HOME_CATEGORY_LABEL } from "@/config/categories";
import dynamic from "next/dynamic";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "@/components/search/SearchDropdown";

const JejuTimeSidebar = dynamic(() => import("./JejuTimeSidebar"), { ssr: false });

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export default function JejuTimeHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const activeCategory = searchParams.get("category") ?? "";
  const isHome = pathname === "/" && !activeCategory;
  const isCatActive = (cat: string) => activeCategory.toLowerCase() === cat.toLowerCase();
  const navRef = useRef<HTMLDivElement>(null);
  const { suggestions, isSearching, showSuggestions, hideSuggestions } = useSearchSuggestions(query);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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

  const coreCategories = getCoreCategories("jejutime.com");

  const categoryLinks = [
    { name: HOME_CATEGORY_LABEL, link: "/" },
    ...coreCategories.map((categoryName) => ({
      name: categoryName,
      link: categoryHref(categoryName),
    })),
  ];

  useEffect(() => {
    // Resync editable query state when the URL search param changes externally
    // (nav/back-forward) — user can still freely edit `query` between syncs.
    const q = searchParams.get("search") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(q);
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
    <div className="flex flex-col">


      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-blue-50 shadow-sm flex flex-col">
        {/* Main Header Top */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 w-full flex items-center justify-between lg:grid lg:grid-cols-3">
          
          {/* Left: Menu & Logo (Mobile) / Menu & Logo (Desktop) */}
          <div className="flex items-center space-x-5 lg:space-x-8">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isSidebarOpen}
              aria-haspopup="dialog"
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-900 hover:scale-110 transition-transform"
            >
              <Menu size={22} />
            </button>
            <Link href="/" className={`${isMobileSearchOpen ? 'hidden md:block' : 'block'} flex-shrink-0`}>
              <div className="relative h-15 w-56 sm:h-19 sm:w-64 lg:h-20 lg:w-[480px] shrink-0 transition-all duration-300 -ml-1">
                <Image
                  src="/Logo/JEJUTIMELOGO.png"
                  alt="JejuTime Logo"
                  fill
                  className="object-contain object-left scale-110 lg:scale-115 transition-transform"
                  priority
                  sizes="(max-width: 768px) 300px, 500px"
                />
              </div>
            </Link>
          </div>

          {/* Center: Search (Desktop) / Search Toggle (Mobile) */}
          <div className={`flex-1 flex justify-center items-center ${isMobileSearchOpen ? 'flex' : 'hidden md:flex'}`}>
            <form onSubmit={handleSearch} className="relative w-full max-w-[280px] lg:max-w-[320px]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={hideSuggestions}
                placeholder="SEARCH..."
                className="bg-slate-50 border border-slate-200 rounded-full px-8 py-2 text-[10px] w-full outline-none focus:bg-white focus:border-blue-400/50 transition-all text-slate-800 placeholder:text-slate-500 font-bold uppercase tracking-widest"
              />
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              {isMobileSearchOpen && (
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 md:hidden"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              )}
              {showSuggestions && (
                <SearchDropdown
                  query={query}
                  suggestions={suggestions}
                  isSearching={isSearching}
                  theme="jejutime"
                  onSelect={hideSuggestions}
                />
              )}
            </form>
          </div>
 
          {/* Right: Actions (Desktop) / Search Icon (Mobile) */}
          <div className="flex items-center space-x-4 justify-end">
            {!isMobileSearchOpen && (
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="md:hidden text-blue-900 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Open search"
              >
                <Search size={22} />
              </button>
            )}

            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={onOpenNewsletter}
                className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-baskerville font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
              >
                SUBSCRIBE
              </button>
              
              <ContactEmailButton
                buttonClassName="text-slate-600 hover:text-blue-600 transition-colors"
                iconSize={18}
              />
              <Link href="/admin/dashboard" className="text-slate-600 hover:text-blue-600 transition-colors" title="Admin">
                <User size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Secondary Bar - Now with Native Mobile Scroll and Navigation Arrows */}
        <div className="bg-black border-t border-white/10 overflow-hidden relative">
           <div className="max-w-7xl mx-auto px-4 lg:px-6 h-11 lg:h-12 flex items-center relative">
             
             {/* Left Arrow */}
             <div className={`absolute left-0 top-0 bottom-0 z-10 flex items-center transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent w-12 sm:w-16" />
                <button 
                  onClick={() => scroll('left')}
                  className="relative ml-1 sm:ml-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
             </div>

             <nav 
               ref={navRef}
               className="flex items-center space-x-8 lg:space-x-10 text-[10px] lg:text-[11px] font-baskerville font-bold uppercase tracking-[0.15em] lg:tracking-[0.2em] text-white overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-1 flex-1 scrollbar-hide"
             >
                <Link
                  href="/"
                  className={`transition-colors whitespace-nowrap ${isHome ? "text-blue-400 font-extrabold" : "hover:text-blue-400"}`}
                  aria-current={isHome ? "page" : undefined}
                >
                  {HOME_CATEGORY_LABEL}
                </Link>
               {coreCategories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/search?category=${encodeURIComponent(cat)}`}
                    className={`transition-colors whitespace-nowrap ${isCatActive(cat) ? "text-blue-400 font-extrabold" : "hover:text-blue-400"}`}
                    aria-current={isCatActive(cat) ? "page" : undefined}
                  >
                    {cat}
                  </Link>
                ))}
             </nav>

             {/* Right Arrow */}
             <div className={`absolute right-0 top-0 bottom-0 z-10 flex items-center transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-gradient-to-l from-black via-black/80 to-transparent w-12 sm:w-16" />
                <button 
                  onClick={() => scroll('right')}
                  className="relative mr-1 sm:mr-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
             </div>

           </div>
        </div>
      </header>
    </div>

      <JejuTimeSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenNewsletter={onOpenNewsletter}
        categoryLinks={categoryLinks}
        categoryHref={categoryHref}
      />
    </>
  );
}
