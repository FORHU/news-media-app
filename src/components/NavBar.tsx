"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import {
  CORE_CATEGORIES,
  HOME_CATEGORY_LABEL,
  normalizeCategoryKey,
} from "@/config/categories";

function categoryHref(categoryName: string) {
  return `/?category=${encodeURIComponent(categoryName)}`;
}

export function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHome = pathname === "/";
  const selectedCategory = searchParams.get("category");
  const selectedCategoryKey = normalizeCategoryKey(selectedCategory);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => articlesApi.getCategories(),
  });

  const coreCategoryKeys = new Set(
    CORE_CATEGORIES.map((category) => normalizeCategoryKey(category))
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("nav")) setIsMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="hidden md:block bg-black relative z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap items-center justify-start lg:justify-center gap-x-1 gap-y-0 py-0">
          <li className="relative flex items-center">
            <Link
              href="/"
              className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isHome && !selectedCategory
                ? "text-[#ff4500] border-[#ff4500]"
                : "text-white border-transparent hover:text-[#ff4500]"
                }`}
            >
              {HOME_CATEGORY_LABEL}
            </Link>
          </li>

          {CORE_CATEGORIES.map((categoryName) => {
            const isActive =
              selectedCategoryKey === normalizeCategoryKey(categoryName);
            return (
              <li key={categoryName} className="relative flex items-center">
                <Link
                  href={categoryHref(categoryName)}
                  className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive
                    ? "text-[#ff4500] border-[#ff4500]"
                    : "text-white border-transparent hover:text-[#ff4500]"
                    }`}
                >
                  {categoryName}
                </Link>
              </li>
            );
          })}

          {overflowCategories.length > 0 && (
            <li
              className="relative group flex items-center"
              onMouseEnter={() => setIsMoreOpen(true)}
              onMouseLeave={() => setIsMoreOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsMoreOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors w-full text-left ${selectedCategoryKey && overflowCategories.some((name) => normalizeCategoryKey(name) === selectedCategoryKey)
                  ? "text-[#ff4500] border-[#ff4500]"
                  : "text-white border-transparent hover:text-[#ff4500]"
                  }`}
              >
                More
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full w-[28rem] max-w-[90vw] bg-white shadow-xl rounded-b-lg overflow-hidden border border-gray-100 p-2 z-[100]"
                  >
                    <ul className="grid grid-cols-2 lg:grid-cols-3 gap-1 max-h-80 overflow-y-auto">
                      {overflowCategories.map((categoryName) => (
                        <li key={categoryName}>
                          <Link
                            href={categoryHref(categoryName)}
                            className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-[#ff4500]/5 hover:text-[#ff4500] transition-colors"
                          >
                            {categoryName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
