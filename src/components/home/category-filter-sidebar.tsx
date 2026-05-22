"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface CategoryFilterSidebarProps {
  categories: string[];
}

export function CategoryFilterSidebar({ categories }: CategoryFilterSidebarProps) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category")
    ? decodeURIComponent(searchParams.get("category")!)
    : null;

  if (!categories || categories.length === 0) return null;

  return (
    <div className="pb-6 border-b border-gray-200">
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black mb-3">
        Categories
      </p>
      <div className="flex flex-col gap-1">
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/search?category=${encodeURIComponent(cat)}`}
            className={`px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border transition-all whitespace-nowrap ${
              activeCategory === cat
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black/40 hover:border-black hover:bg-black hover:text-white"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>
    </div>
  );
}
