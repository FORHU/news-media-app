"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, Bell, Menu, ChevronDown, User, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { CORE_CATEGORIES, normalizeCategoryKey } from "@/config/categories";
import { AnimatePresence, motion } from "framer-motion";
import type { Article } from "@/lib/types";

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

export default function JejuTimeHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

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
    <div className="flex flex-col">
      {/* Top Black Bar (Shared with NewsIcons style but Jeju branded) */}
      <div className="bg-[#1a1a1a] text-white py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold tracking-widest uppercase opacity-60">
          <div className="flex space-x-6">
            <span>Coastal Edition</span>
            <span>Volcanic soul</span>
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
            <Menu size={20} className="text-blue-900 cursor-pointer hover:scale-110 transition-transform" />
            <Link href="/">
              <h1 className="text-3xl font-playfair font-black tracking-tighter text-blue-950">
                Jeju <span className="text-blue-600/80">Times</span>
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
  );
}
