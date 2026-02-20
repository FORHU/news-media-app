"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function categoryHref(categoryName: string) {
  return `/?category=${encodeURIComponent(categoryName)}`;
}

const NAV_LINKS = [
  { href: "/", label: "Latest News" },
  {
    href: "/",
    label: "News & Current Events",
    subcategories: [
      { label: "World News", href: categoryHref("World News") },
      { label: "Local Updates", href: categoryHref("Local Updates") },
    ]
  },
  {
    href: "/",
    label: "Business & Technology",
    subcategories: [
      { label: "Markets", href: categoryHref("Markets") },
      { label: "Startups", href: categoryHref("Startups") },
      { label: "AI & Innovation", href: categoryHref("AI & Innovation") },
    ]
  },
  {
    href: "/",
    label: "Lifestyle",
    subcategories: [
      { label: "Health & Wellness", href: categoryHref("Health & Wellness") },
      { label: "Travel", href: categoryHref("Travel") },
    ]
  },
  {
    href: "/",
    label: "Entertainment & Sports",
    subcategories: [
      { label: "Entertainment & Culture", href: categoryHref("Entertainment & Culture") },
      { label: "Sports & Fitness", href: categoryHref("Sports & Fitness") },
      { label: "Automotive", href: categoryHref("Automotive") },
    ]
  },
  {
    href: "/",
    label: "Personal Growth",
    subcategories: [
      { label: "Education & Learning", href: categoryHref("Education & Learning") },
      { label: "Personal Development", href: categoryHref("Personal Development") },
    ]
  },
  {
    href: "/",
    label: "Opinion & Creative",
    subcategories: [
      { label: "Editorials/Opinions", href: categoryHref("Editorials/Opinions") },
      { label: "Creative Writing", href: categoryHref("Creative Writing") },
      { label: "DIY and How to", href: categoryHref("DIY and How to") },
    ]
  },
];

export function NavBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <nav className="hidden md:block bg-black relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center justify-start lg:justify-center gap-1 py-0 px-2 lg:px-0 overflow-x-auto scrollbar-hide">
          {NAV_LINKS.map(({ href, label, subcategories }) => {
            const isLatestNews = label === "Latest News" && isHome;
            const hasSub = subcategories && subcategories.length > 0;

            return (
              <li
                key={label}
                className="relative group h-full flex items-center"
                onMouseEnter={() => hasSub && setActiveDropdown(label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={href}
                  className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isLatestNews
                    ? "text-[#ff4500] border-[#ff4500]"
                    : "text-white border-transparent hover:text-[#ff4500]"
                    }`}
                >
                  {label}
                  {hasSub && (
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === label ? "rotate-180" : ""}`} />
                  )}
                </Link>

                {/* Desktop Dropdown */}
                {hasSub && (
                  <AnimatePresence>
                    {activeDropdown === label && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full w-56 bg-white shadow-xl rounded-b-lg overflow-hidden border border-gray-100 py-2 pt-0 z-[100]"
                      >
                        <ul className="flex flex-col">
                          {subcategories.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                href={sub.href}
                                className="block px-6 py-3 text-sm text-gray-700 hover:bg-[#ff4500]/5 hover:text-[#ff4500] transition-colors border-l-4 border-transparent hover:border-[#ff4500]"
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
