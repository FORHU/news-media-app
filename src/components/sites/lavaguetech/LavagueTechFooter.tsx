"use client";

import Link from "next/link";
import { AdBanner, Banner } from "@/components/AdBanner";
import { getCoreCategories } from "@/config/categories";

interface FooterProps {
  onOpenNewsletter?: () => void;
  footerBanners?: Banner[];
}

const categories = getCoreCategories("lavaguetech.com");

export default function LavagueTechFooter({ onOpenNewsletter, footerBanners }: FooterProps) {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <AdBanner position="GLOBAL_FOOTER" initialBanners={footerBanners} />
      </div>

      <footer className="bg-blue-950 border-t border-blue-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Top grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">

            {/* Brand + tagline */}
            <div className="lg:col-span-3">
              <div className="mb-5">
                <span className="text-white font-black text-2xl tracking-tight">
                  <span className="text-red-400">L</span>avague<span className="text-blue-300">T</span>ech
                </span>
              </div>
              <p className="text-blue-200/60 text-sm leading-relaxed max-w-xs">
                The next wave of technology news — sharp insights, bold perspectives, and stories that matter.
              </p>
            </div>

            {/* Explore */}
            <div className="lg:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white mb-6">Explore</h4>
              <ul className="space-y-3 text-sm text-blue-200/60">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Search</Link></li>
                <li><Link href="/#latest" className="hover:text-white transition-colors">Latest News</Link></li>
                <li><Link href="/#trending" className="hover:text-white transition-colors">Trending</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div className="lg:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white mb-6">Topics</h4>
              <ul className="space-y-3 text-sm text-blue-200/60">
                {categories.map((cat) => (
                  <li key={cat}>
                    <Link href={`/search?category=${encodeURIComponent(cat)}`} className="hover:text-white transition-colors">
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-3">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white mb-6">Newsletter</h4>
              <p className="text-blue-200/60 text-xs leading-relaxed mb-5 max-w-[200px]">
                Get the latest tech stories delivered to your inbox.
              </p>
              <button
                onClick={onOpenNewsletter}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors group"
              >
                Subscribe
                <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-blue-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-blue-300/50 font-medium">
              © {new Date().getFullYear()} LavagueTech. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-[11px] text-blue-300/50">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/admin/dashboard" className="hover:text-white transition-colors">Admin</Link>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
