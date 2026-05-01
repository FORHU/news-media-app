"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Bell, Menu, ChevronDown, User, Loader2, X, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { CORE_CATEGORIES, HOME_CATEGORY_LABEL, normalizeCategoryKey } from "@/config/categories";
import { AnimatePresence, motion } from "framer-motion";
import { RemoveScroll } from "react-remove-scroll";
import type { Article } from "@/lib/types";

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export default function JejuTimeHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const coreCategoryKeys = new Set(
    CORE_CATEGORIES.map((c) => normalizeCategoryKey(c))
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
    ...CORE_CATEGORIES.map((cat) => ({ name: cat, link: categoryHref(cat) })),
  ];

  useEffect(() => {
    const q = searchParams.get("search") ?? "";
    setQuery(q);
  }, [searchParams]);

  // Search Suggestions Logic
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  return (
    <>
    <div className="flex flex-col">
      {/* Top Black Bar (Shared with NewsIcons style but Jeju branded) */}
      <div className="bg-[#1a1a1a] text-white py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold tracking-widest uppercase opacity-60">
          <div className="flex space-x-6">
          </div>
          <div className="flex space-x-4">
             <Link href="/admin/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
                <User size={12} /> Admin
             </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-blue-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          
          <div className="flex items-center space-x-8 shrink-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="text-blue-900 hover:scale-110 transition-transform"
            >
              <Menu size={20} />
            </button>
            <Link href="/">
              <h1 className="text-3xl font-playfair font-black tracking-tighter text-blue-950">
                Jeju <span className="text-blue-600/80">Time</span>
              </h1>
            </Link>
          </div>

          {/* Dynamic Categories Nav */}
          <nav className="hidden lg:flex flex-1 justify-center items-center space-x-6 text-[12px] font-bold uppercase tracking-[0.15em] text-slate-500">
            {CORE_CATEGORIES.slice(0, 6).map((cat) => (
              <Link 
                key={cat} 
                href={`/search?category=${encodeURIComponent(cat)}`}
                className="hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {cat}
              </Link>
            ))}
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-blue-600">
               MORE <ChevronDown size={14} />
               <div className="absolute top-full left-0 pt-4 hidden group-hover:block">
                  <div className="bg-white shadow-2xl border border-slate-100 p-6 rounded-2xl grid grid-cols-2 gap-x-12 gap-y-4 w-[400px]">
                     {categories.slice(6, 16).map((cat: any) => (
                       <Link key={cat.id} href={`/search?category=${encodeURIComponent(cat.name)}`} className="text-slate-500 hover:text-blue-600 lowercase tracking-normal text-sm font-light">
                          {cat.name}
                       </Link>
                     ))}
                  </div>
               </div>
            </div>
          </nav>

          <div className="flex items-center space-x-5 shrink-0">
            {/* Search Container */}
            <div className="relative search-container">
              <form onSubmit={handleSearch} className="relative">
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.trim() && setShowSuggestions(true)}
                  placeholder="Deep search..."
                  className="bg-slate-100 border-none rounded-full px-6 py-2 text-xs w-40 focus:w-64 transition-all duration-500 outline-none focus:ring-2 focus:ring-blue-100"
                />
                <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </form>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-4 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-50 w-[350px]"
                  >
                    {isSearching ? (
                      <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : suggestions.length > 0 ? (
                      <div className="py-2">
                        {suggestions.map((article) => (
                          <Link
                            key={article.id}
                            href={`/article/${article.slug ?? article.id}`}
                            className="block px-6 py-3 hover:bg-blue-50 transition-colors"
                            onClick={() => setShowSuggestions(false)}
                          >
                            <span className="text-[13px] font-bold text-slate-900 line-clamp-1">{article.title}</span>
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{article.category?.categoryName}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-sm text-slate-400 text-center italic">No whispers found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={onOpenNewsletter}
              className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
            >
              SUBSCRIBE
            </button>
          </div>
        </div>
      </header>
    </div>

      {/* JejuTime Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm z-[60]"
              onClick={() => setIsSidebarOpen(false)}
            />
            <RemoveScroll enabled={isSidebarOpen}>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-[100dvh] w-full sm:w-80 max-w-[85vw] bg-white z-[70] shadow-2xl flex flex-col overflow-hidden rounded-r-3xl"
              >
                {/* Sidebar Header */}
                <div className="flex-shrink-0 bg-blue-950 h-16 px-5 flex items-center justify-between rounded-tr-3xl">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 text-blue-200 hover:text-white transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-black text-white tracking-[0.3em] uppercase font-playfair">Menu</span>
                  <div className="w-8" />
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto">
                  <nav className="py-3">
                    {categoryLinks.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.link}
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-7 py-3 text-[15px] font-bold text-slate-800 hover:text-blue-600 hover:bg-blue-50 border-b border-slate-100 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    {overflowCategories.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center justify-between px-7 py-3 text-[15px] font-bold text-slate-800 hover:text-blue-600 hover:bg-blue-50 border-b border-slate-100 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          <span>More</span>
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="bg-slate-50">
                          {overflowCategories.map((name) => (
                            <Link
                              key={name}
                              href={categoryHref(name)}
                              onClick={() => setIsSidebarOpen(false)}
                              className="block px-10 py-2.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              {name}
                            </Link>
                          ))}
                        </div>
                      </details>
                    )}
                  </nav>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-slate-100 p-5">
                  <button
                    type="button"
                    onClick={() => { setIsSidebarOpen(false); onOpenNewsletter?.(); }}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-blue-600 text-white text-xs font-bold rounded-2xl uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all mb-4"
                  >
                    <Mail className="w-4 h-4" />
                    Subscribe
                  </button>
                  <div className="text-center">
                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mb-3">Follow Us</p>
                    <div className="flex items-center justify-center gap-5">
                      <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </a>
                      <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </a>
                      <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
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
