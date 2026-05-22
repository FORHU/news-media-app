"use client";

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import { Mail, Globe } from "lucide-react";
import { getCoreCategories } from "@/config/categories";

interface SkyBluePrimeFooterProps {
  onOpenNewsletter?: () => void;
}

const SECTIONS_LIMIT = 5;

export default function SkyBluePrimeFooter({ onOpenNewsletter }: SkyBluePrimeFooterProps) {
  const categories = getCoreCategories("skyblueprime.com");

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 w-full mt-8 mb-4">
        <AdBanner position="GLOBAL_FOOTER" />
      </div>
      <footer className="bg-gradient-to-b from-sky-950 to-slate-950 text-white pt-14 pb-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">

            {/* Brand */}
            <div className="md:col-span-4">
              <Link href="/" className="inline-block mb-4">
                <span className="text-2xl font-black tracking-tighter text-white bg-sky-900 px-2 py-0.5 leading-none">
                  SKY<span className="text-sky-400">BLUE</span>PRIME
                </span>
              </Link>
              <p className="mt-4 text-sm text-sky-200/80 leading-relaxed max-w-sm">
                Clear reporting and curated stories — your daily source for AI, tech, cybersecurity, and the digital world.
              </p>
              <div className="mt-6 flex gap-3">
                <a
                  href="/"
                  aria-label="skyblueprime.com"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sky-300 transition-colors"
                >
                  <Globe size={16} />
                </a>
                <a
                  href="mailto:contact@skyblueprime.com"
                  aria-label="Contact"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sky-300 transition-colors"
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>

            {/* Sections */}
            <div className="md:col-span-2">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-sky-400 mb-4">Sections</h4>
              <ul className="space-y-3 text-sm text-sky-100/70">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">All Stories</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Advertise</Link></li>
              </ul>
            </div>

            {/* Topics */}
            <div className="md:col-span-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-sky-400 mb-4">Topics</h4>
              <ul className="space-y-3 text-sm text-sky-100/70">
                {categories.slice(0, SECTIONS_LIMIT).map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/search?category=${encodeURIComponent(cat)}`}
                      className="hover:text-white transition-colors"
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-sky-300 mb-3">Newsletter</h4>
              <p className="text-sm text-sky-100/70 mb-4 leading-relaxed">
                Get top tech headlines delivered to your inbox each morning.
              </p>
              {onOpenNewsletter && (
                <button
                  type="button"
                  onClick={onOpenNewsletter}
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-widest bg-sky-500 hover:bg-sky-400 text-white transition-colors"
                >
                  Subscribe
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-sky-300/60">
            <p>&copy; {new Date().getFullYear()} Sky Blue Prime. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-sky-300 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-sky-300 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-sky-300 transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
