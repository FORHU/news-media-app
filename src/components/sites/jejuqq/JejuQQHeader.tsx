"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Menu, Youtube, Mail, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { CORE_CATEGORIES } from "@/config/categories";

interface HeaderProps {
  onOpenNewsletter?: () => void;
}

export default function JejuQQHeader({ onOpenNewsletter }: HeaderProps) {
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
    <header className="bg-white border-b-4 border-[#ff4500]">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-[#ff4500] p-2 cursor-pointer">
            <Menu size={20} className="text-white" />
          </div>
          <form onSubmit={handleSearch} className="flex h-8">
            <div className="relative flex items-center">
                <Search size={14} className="absolute left-2 text-gray-400" />
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..." 
                    className="pl-8 pr-2 border border-gray-200 h-full text-sm outline-none w-48"
                />
            </div>
            <button className="bg-black text-white px-4 text-[11px] font-bold h-full">GO</button>
          </form>
        </div>
        
        <div className="flex items-center space-x-6 text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
          <Link href="#" className="hover:text-[#ff4500] flex items-center gap-1">
             <Youtube size={16} className="text-[#ff4500]" />
          </Link>
          <button onClick={onOpenNewsletter} className="hover:text-[#ff4500] flex items-center gap-1">
             <Mail size={14} /> Newsletter
          </button>
          <Link href="#" className="hover:text-[#ff4500] flex items-center gap-1">
             <FileText size={14} /> Print Edition
          </Link>
        </div>
      </div>

      {/* Logo & Main Nav */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center lg:flex-row lg:justify-between lg:items-end">
          <Link href="/" className="mb-6 lg:mb-0">
             <div className="flex flex-col leading-none">
                <span className="text-[52px] font-serif font-black tracking-tighter text-black">Jeju</span>
                <span className="text-[42px] font-serif font-black tracking-tighter text-black -mt-4">QQ Daily</span>
             </div>
          </Link>
          
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[16px] font-bold text-black">
            {CORE_CATEGORIES.map((cat) => (
              <Link key={cat} href={`/search?category=${encodeURIComponent(cat)}`} className="hover:text-[#ff4500] transition-colors">
                {cat}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
