"use client"; // VoiceJeju Footer Component

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import { Twitter, Instagram, Facebook, Mail, Globe, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string | null;
  positions: string[];
}

interface FooterProps {
  onOpenNewsletter?: () => void;
  footerBanners?: Banner[];
}

export function VoiceJejuFooter({ onOpenNewsletter, footerBanners }: FooterProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <footer className="bg-black text-white pt-20 pb-12 font-inter">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Top Section: Large Logo */}
        <div className="flex flex-col items-center mb-16 pb-16 border-b border-gray-800">
          <Link href="/" className="mb-8">
            <span className="text-7xl lg:text-9xl font-normal text-white font-voltaire tracking-tight uppercase">VoiceJeju</span>
          </Link>
          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
             <span>{today}</span>
             <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
             <div className="flex items-center gap-2">
                <Sun size={12} />
                <span>Jeju City</span>
             </div>
          </div>
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-4">
            <h4 className="text-[11px] font-black text-white mb-8 uppercase tracking-[0.3em]">Our Mission</h4>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-10 font-medium">
              We deliver independent, high-impact journalism from the heart of Jeju. Our narratives are crafted to inspire, inform, and ignite global conversations.
            </p>
            <div className="flex space-x-8 text-gray-400">
              <Twitter size={20} className="hover:text-white cursor-pointer transition-colors" />
              <Instagram size={20} className="hover:text-white cursor-pointer transition-colors" />
              <Facebook size={20} className="hover:text-white cursor-pointer transition-colors" />
              <Mail size={20} className="hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-black text-white mb-8 uppercase tracking-[0.3em]">Explore</h4>
            <ul className="space-y-4 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <li><Link href="/#top" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/#latest-stories" className="hover:text-white transition-colors">Latest News</Link></li>
              <li><Link href="/#trending-stories" className="hover:text-white transition-colors">Trending</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-black text-white mb-8 uppercase tracking-[0.3em]">The Desk</h4>
            <ul className="space-y-4 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <li><Link href="/search?category=제주 오늘" className="hover:text-white transition-colors">Jeju Today</Link></li>
              <li><Link href="/search?category=여행 및 관광" className="hover:text-white transition-colors">Travel & Tourism</Link></li>
              <li><Link href="/search?category=음식 및 맛집" className="hover:text-white transition-colors">Food & Restaurants</Link></li>
              <li><Link href="/search?category=이벤트 및 축제" className="hover:text-white transition-colors">Events & Festivals</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4 bg-gray-900/50 p-10 border border-gray-800">
            <h4 className="text-[11px] font-black text-white mb-4 uppercase tracking-[0.3em]">The Newsletter</h4>
            <p className="text-gray-400 text-sm mb-8 font-medium leading-relaxed">
               Receive our curated weekly briefing on Jeju and beyond.
            </p>
            <button 
              onClick={onOpenNewsletter}
              className="w-full bg-white text-black px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all"
            >
               Subscribe Now
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-900 pt-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 space-y-6 md:space-y-0">
          <p>© 2026 VoiceJeju. All rights reserved. Part of the Jeju Global Network.</p>
          <div className="flex space-x-10">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Advertising</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
