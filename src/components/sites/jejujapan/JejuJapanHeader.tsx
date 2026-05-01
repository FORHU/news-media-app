"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, Globe, User, X, ChevronDown, Mail } from "lucide-react";
import { CORE_CATEGORIES, HOME_CATEGORY_LABEL, normalizeCategoryKey } from "@/config/categories";
import { motion, AnimatePresence } from "framer-motion";
import { RemoveScroll } from "react-remove-scroll";
import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export default function JejuJapanHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

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
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        {/* Top Thin Bar */}
        <div className="border-b border-gray-100 py-2 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <div className="flex space-x-6">
              <span className="flex items-center gap-1"><Globe size={12} className="text-[#bc002d]" /> Tokyo - Jeju Bridge</span>
              <span>{new Date().toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/admin/dashboard" className="hover:text-[#bc002d] transition-colors">Admin</Link>
              <button onClick={onOpenNewsletter} className="hover:text-[#bc002d] transition-colors">Newsletter</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="text-black hover:text-[#bc002d] transition-colors"
            >
              <Menu size={24} />
            </button>
            <Link href="/">
              <div className="flex flex-col">
                <h1 className="text-3xl font-serif font-black tracking-tighter text-black flex items-center gap-2">
                  <span className="text-[#bc002d]">JEJU</span> JAPAN
                </h1>
                <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 -mt-1 ml-1">NEWS NETWORK</span>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex space-x-8 text-[13px] font-bold text-gray-900">
            {CORE_CATEGORIES.map((cat) => (
              <Link key={cat} href={`/search?category=${encodeURIComponent(cat)}`} className="hover:text-[#bc002d] transition-colors border-b-2 border-transparent hover:border-[#bc002d] pb-1">
                {cat}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-6">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search news..."
                className="bg-gray-50 border border-gray-100 rounded-sm px-4 py-1.5 text-xs w-64 focus:w-80 transition-all outline-none focus:border-[#bc002d]/30"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </form>
          </div>
        </div>
      </header>

      {/* JejuJapan Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => setIsSidebarOpen(false)}
            />
            <RemoveScroll enabled={isSidebarOpen}>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-[100dvh] w-full sm:w-80 max-w-[85vw] bg-white z-[70] shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Sidebar Header */}
                <div className="flex-shrink-0 bg-[#111] h-14 px-5 flex items-center justify-between">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 text-white hover:text-[#bc002d] transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-black text-white tracking-[0.4em] uppercase font-serif">Menu</span>
                  <div className="w-8" />
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto">
                  <nav className="py-4">
                    {categoryLinks.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.link}
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-7 py-3 text-[15px] font-bold text-gray-900 hover:text-[#bc002d] hover:bg-[#bc002d]/5 border-b border-gray-100 transition-colors tracking-wide"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    {overflowCategories.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center justify-between px-7 py-3 text-[15px] font-bold text-gray-900 hover:text-[#bc002d] hover:bg-[#bc002d]/5 border-b border-gray-100 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          <span>More</span>
                          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#bc002d] group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="bg-gray-50">
                          {overflowCategories.map((name) => (
                            <Link
                              key={name}
                              href={categoryHref(name)}
                              onClick={() => setIsSidebarOpen(false)}
                              className="block px-10 py-2.5 text-sm text-gray-600 hover:text-[#bc002d] hover:bg-[#bc002d]/5 transition-colors"
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
                <div className="flex-shrink-0 border-t border-gray-100 p-5">
                  <button
                    type="button"
                    onClick={() => { setIsSidebarOpen(false); onOpenNewsletter?.(); }}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-[#bc002d] text-white text-xs font-black uppercase tracking-widest hover:bg-[#a0001f] transition-colors mb-4"
                  >
                    <Mail className="w-4 h-4" />
                    Newsletter
                  </button>
                  <div className="text-center">
                    <p className="text-[10px] text-[#bc002d] font-black uppercase tracking-[0.2em] mb-3">Follow Us</p>
                    <div className="flex items-center justify-center gap-5">
                      <a href="#" className="text-gray-700 hover:text-[#bc002d] transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </a>
                      <a href="#" className="text-gray-700 hover:text-[#bc002d] transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </a>
                      <a href="#" className="text-gray-700 hover:text-[#bc002d] transition-colors">
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
