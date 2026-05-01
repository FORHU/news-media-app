"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, Globe, User } from "lucide-react";
import { CORE_CATEGORIES } from "@/config/categories";

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

export default function JejuJapanHeader({ onOpenNewsletter }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

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
          <Menu size={24} className="text-black cursor-pointer hover:text-[#bc002d] transition-colors" />
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
              className="bg-gray-50 border border-gray-100 rounded-sm px-4 py-1.5 text-xs w-48 focus:w-64 transition-all outline-none focus:border-[#bc002d]/30"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </form>
          <button className="bg-black text-white px-6 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-[#bc002d] transition-colors">
            Subscribe
          </button>
        </div>
      </div>
    </header>
  );
}
