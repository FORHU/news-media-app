"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Menu, Mail, User } from "lucide-react";
import { SideBar } from "./SideBar";

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get("search") ?? "";
    setQuery(q);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  return (
    <header className="sticky top-0 z-[60] bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-2 sm:gap-4">
          {/* Left: Hamburger + Search Icon (Mobile) / Search Form (Desktop) */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Search (Flexible but capped) */}
            <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                />
              </div>
            </form>

            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Center Column: FORHU logo */}
          <div className="flex-none flex justify-center px-2">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight shrink-0 whitespace-nowrap"
            >
              FORHU
            </Link>
          </div>

          {/* Right Column: NEWSLETTER + Profile */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 justify-end min-w-0">
            <button
              type="button"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">NEWSLETTER</span>
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Profile"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white animate-in slide-in-from-top duration-200">
            <form onSubmit={handleSearch} className="px-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  autoFocus
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-200 outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full py-2 bg-[#ff4500] text-white rounded-lg font-medium text-sm"
              >
                Search
              </button>
            </form>
          </div>
        )}

        <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>
    </header>
  );
}
