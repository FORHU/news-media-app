"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, Mail, User } from "lucide-react";

export function Header() {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Search bar is display-only; no search logic yet
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Left: Hamburger + Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
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
          </div>

          {/* Center: FORHU logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-gray-900 tracking-tight shrink-0"
          >
            FORHU
          </Link>

          {/* Right: NEWSLETTER + Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors"
            >
              <Mail className="w-4 h-4" />
              NEWSLETTER
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Profile"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-2xl placeholder:text-gray-400 focus:ring-2 focus:ring-gray-200 outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full py-2 bg-[#ff4500] text-white rounded-lg font-medium"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
