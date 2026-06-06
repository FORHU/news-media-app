"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Mail, X, User } from "lucide-react";
import ContactEmailButton from "@/components/ContactEmailButton";
import { getCoreCategories, getHomeCategoryLabel } from "@/config/categories";
import { motion, AnimatePresence } from "framer-motion";
import { RemoveScroll } from "react-remove-scroll";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "@/components/search/SearchDropdown";

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export default function JejuQQHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { suggestions, isSearching, showSuggestions, hideSuggestions } = useSearchSuggestions(query);

  const activeCategory = searchParams.get("category") ?? "";
  const isHome = pathname === "/" && !activeCategory;
  const isCatActive = (cat: string) => activeCategory.toLowerCase() === cat.toLowerCase();

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const homeLabel = getHomeCategoryLabel("jejuqq.com");
  const coreCategories = getCoreCategories("jejuqq.com");

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsSidebarOpen(false); setIsSearchOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?search=${encodeURIComponent(trimmed)}` : "/search");
    hideSuggestions();
  };

  return (
    <>
      <header className="bg-[#fee2e2] border-b-2 border-[#dc2626]/10 shadow-sm sticky top-0 z-50">
        <div className="bg-[#dc2626] h-1.5 w-full"></div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 md:h-24 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Burger & Logo */}
          <div className="flex items-center gap-4 lg:gap-8">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isSidebarOpen}
              aria-haspopup="dialog"
              className="group flex items-center gap-2 min-h-[44px] hover:text-[#dc2626] transition-all duration-300"
            >
              <div className="relative flex flex-col justify-between w-5 h-3.5 group-hover:gap-1 transition-all">
                <span className="w-full h-0.5 bg-black group-hover:bg-primary transition-colors"></span>
                <span className="w-3/4 h-0.5 bg-black group-hover:bg-primary transition-colors"></span>
                <span className="w-full h-0.5 bg-black group-hover:bg-primary transition-colors"></span>
              </div>
              <span className="text-[10px] font-bold font-serif uppercase tracking-[0.2em] hidden sm:block">Menu</span>
            </button>

            <Link href="/" className="hover:opacity-90 transition-opacity flex-shrink-0">
              <div className="relative h-10 w-32 sm:h-15 sm:w-48 md:h-20 md:w-60 shrink-0 transition-all duration-300 -ml-1">
                <Image
                  src="/Logo/JEJUQQLOGO.png"
                  alt="JejuQQ Logo"
                  fill
                  className="object-contain object-left scale-110 md:scale-110 transition-transform"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="flex-1 max-w-xl hidden lg:block">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative flex items-center group">
                <Search size={16} className="absolute left-4 text-gray-400 group-focus-within:text-[#dc2626] transition-colors" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={hideSuggestions}
                  placeholder="SEARCH FOR STORIES..."
                  className="w-full pl-11 pr-4 bg-gray-50 border-2 border-primary rounded-none h-11 text-[11px] font-bold outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                />
              </div>
              {showSuggestions && (
                <SearchDropdown
                  query={query}
                  suggestions={suggestions}
                  isSearching={isSearching}
                  theme="jejuqq"
                  onSelect={hideSuggestions}
                />
              )}
            </form>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-6">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle search"
              aria-expanded={isSearchOpen}
              className="lg:hidden text-gray-400 hover:text-[#dc2626] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            >
              <Search size={22} />
            </button>
            <button
              onClick={onOpenNewsletter}
              className="bg-[#dc2626] hover:bg-black text-white px-2 sm:px-5 py-2 rounded-none text-[10px] font-bold font-serif uppercase tracking-widest transition-all duration-300 shadow-lg shadow-[#dc2626]/20 flex items-center gap-1.5"
            >
              <Mail size={14} strokeWidth={3} />
              <span className="hidden sm:block">Newsletter</span>
            </button>
            <ContactEmailButton
              buttonClassName="text-[#dc2626] hover:text-black transition-colors flex items-center justify-center"
              iconSize={22}
              strokeWidth={2}
            />
            <Link href="/admin/dashboard" className="text-[#dc2626] hover:text-black transition-colors flex items-center justify-center" title="Admin" aria-label="Admin dashboard">
              <User size={22} strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        <div className={`lg:hidden border-t border-gray-100 bg-white overflow-hidden transition-all duration-200 ${isSearchOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={handleSearch} className="p-4">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SEARCH FOR STORIES..."
                className="w-full pl-11 pr-4 bg-gray-50 border-2 border-[#dc2626] rounded-none h-12 text-[12px] font-bold outline-none focus:bg-white focus:border-[#dc2626] transition-all"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="ml-2 p-2 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-100 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 flex flex-row justify-center items-center py-4">
            <nav className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-[13px] font-bold font-serif uppercase tracking-tighter text-gray-600">
              <Link
                href="/"
                aria-current={isHome ? "page" : undefined}
                className={`relative group py-2 transition-colors ${isHome ? "text-[#dc2626]" : "hover:text-black"}`}
              >
                {homeLabel}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-[#dc2626] transition-all duration-300 ${isHome ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
              {coreCategories.map((cat) => (
                <Link
                  key={cat}
                  href={`/search?category=${encodeURIComponent(cat)}`}
                  aria-current={isCatActive(cat) ? "page" : undefined}
                  className={`relative group py-2 transition-colors ${isCatActive(cat) ? "text-[#dc2626]" : "hover:text-black"}`}
                >
                  {cat}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-[#dc2626] transition-all duration-300 ${isCatActive(cat) ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-transparent">
          <div
            className="h-full bg-[#dc2626]"
            style={{ width: `${scrollProgress}%`, transition: 'width 0.1s linear' }}
          />
        </div>
      </header>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setIsSidebarOpen(false)}
            />
            <RemoveScroll enabled={isSidebarOpen}>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-[100dvh] w-full sm:w-80 max-w-[85vw] bg-[#fdf2f2] z-[70] shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="flex-shrink-0 bg-[#dc2626] h-14 px-5 flex items-center justify-between">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 text-white hover:text-black transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="relative h-10 w-40">
                    <Image
                      src="/Logo/JEJUQQLOGO.png"
                      alt="JejuQQ Logo"
                      fill
                      className="object-contain object-center brightness-0 invert"
                    />
                  </div>
                  <div className="w-8" />
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between px-6 pt-5 pb-1">
                    <div className="flex items-center gap-3">
                      <span className="h-0.5 w-8 bg-[#dc2626]" />
                      <span className="text-[10px] font-bold font-serif uppercase tracking-[0.25em] text-[#dc2626]">Browse</span>
                    </div>
                    <span className="text-[9px] font-serif text-[#dc2626]/50 tabular-nums" suppressHydrationWarning>
                      {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="mx-6 mb-3 h-px bg-[#dc2626]/10" />

                  <nav>
                    {/* Home / Latest News — filled square marker, no number */}
                    <Link
                      href="/"
                      onClick={() => setIsSidebarOpen(false)}
                      className="group flex items-center gap-4 px-6 py-3 border-b border-[#dc2626]/10 transition-all duration-200"
                    >
                      <span className="w-2 h-2 bg-[#dc2626] shrink-0" />
                      <span className="inline-block text-[14px] font-bold font-serif text-gray-900 group-hover:text-[#dc2626] group-hover:translate-x-1 transition-all duration-200">
                        {homeLabel}
                      </span>
                    </Link>

                    {/* Numbered category links (01–N) */}
                    {coreCategories.map((categoryName, i) => (
                      <Link
                        key={categoryName}
                        href={categoryHref(categoryName)}
                        onClick={() => setIsSidebarOpen(false)}
                        className="group flex items-center gap-4 px-6 py-3 border-b border-[#dc2626]/10 transition-all duration-200"
                      >
                        <span className="text-[13px] font-serif font-bold text-[#dc2626]/50 group-hover:text-[#dc2626]/80 tabular-nums shrink-0 w-6 transition-colors">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="inline-block text-[14px] font-bold font-serif text-gray-900 group-hover:text-[#dc2626] group-hover:translate-x-1 transition-all duration-200">
                          {categoryName}
                        </span>
                      </Link>
                    ))}

                  </nav>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 bg-[#fee2e2] border-t-2 border-[#dc2626]/20 p-5">
                  <p className="text-center text-[9px] text-[#dc2626]/50 font-bold font-serif uppercase tracking-[0.25em] mb-3" suppressHydrationWarning>
                    {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })} 刊
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsSidebarOpen(false); onOpenNewsletter?.(); }}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-[#dc2626] text-white text-xs font-bold font-serif uppercase tracking-widest hover:bg-black transition-colors mb-4"
                  >
                    <Mail className="w-4 h-4" />
                    Newsletter
                  </button>
                  <div className="text-center">
                    <p className="text-[10px] text-[#dc2626] font-bold font-serif uppercase tracking-[0.2em] mb-3">Follow Us</p>
                    <div className="flex items-center justify-center gap-5">
                      <a href="#" className="text-gray-700 hover:text-[#dc2626] transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </a>
                      <a href="#" className="text-gray-700 hover:text-[#dc2626] transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </a>
                      <a href="#" className="text-gray-700 hover:text-[#dc2626] transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </RemoveScroll>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
