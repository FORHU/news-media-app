"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Latest News" },
  { href: "/?cat=news-events", label: "News & Events" },
  { href: "/?cat=business-tech", label: "Business & Tech" },
  { href: "/?cat=lifestyle", label: "Lifestyle" },
  { href: "/?cat=entertainment", label: "Entertainment" },
  { href: "/?cat=personal-growth", label: "Personal Growth" },
  { href: "/?cat=opinion", label: "Opinion" },
];

export function NavBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center justify-center gap-1 overflow-x-auto py-0 scrollbar-hide">
          {NAV_LINKS.map(({ href, label }) => {
            const isLatestNews = label === "Latest News" && isHome;
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`block px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isLatestNews
                      ? "text-[#ff4500] border-[#ff4500]"
                      : "text-white border-transparent hover:text-gray-200"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
