"use client";

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import { Mail, Globe } from "lucide-react";

interface SkyBluePrimeFooterProps {
  onOpenNewsletter?: () => void;
}

export default function SkyBluePrimeFooter({ onOpenNewsletter }: SkyBluePrimeFooterProps) {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mt-8 mb-4">
        <AdBanner position="GLOBAL_FOOTER" />
      </div>
      <footer className="bg-gradient-to-b from-sky-950 to-slate-950 text-white pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-5">
              <p className="text-2xl font-bold tracking-tight">
                Sky<span className="text-sky-400">Blue</span>Prime
              </p>
              <p className="mt-4 text-sm text-sky-200/80 leading-relaxed max-w-sm">
                Clear reporting and curated stories — your daily source for politics, business, tech, and world news.
              </p>
              <div className="mt-6 flex gap-3">
                <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sky-300">
                  <Globe size={16} />
                </span>
                <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sky-300">
                  <Mail size={16} />
                </span>
              </div>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-sky-400 mb-4">Sections</h4>
              <ul className="space-y-3 text-sm text-sky-100/70">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Search</Link></li>
              </ul>
            </div>

            <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-sky-300 mb-3">Newsletter</h4>
              <p className="text-sm text-sky-100/70 mb-4 leading-relaxed">
                Get top headlines delivered to your inbox each morning.
              </p>
              {onOpenNewsletter && (
                <button
                  type="button"
                  onClick={onOpenNewsletter}
                  className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-white rounded-full transition-colors"
                >
                  Subscribe
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-sky-300/60">
            <p>&copy; {new Date().getFullYear()} Sky Blue Prime. All rights reserved.</p>
            <p>skyblueprime.com</p>
          </div>
        </div>
      </footer>
    </>
  );
}
