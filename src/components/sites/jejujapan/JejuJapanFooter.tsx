"use client";

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import { Globe, Mail, Phone, MapPin } from "lucide-react";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string | null;
  positions: string[];
}

interface JejuJapanFooterProps {
  onOpenNewsletter?: () => void;
  footerBanners?: Banner[];
}

export default function JejuJapanFooter({ onOpenNewsletter, footerBanners }: JejuJapanFooterProps) {
  return (
    <>
      <div className="max-w-7xl mx-auto px-6 w-full mb-4 mt-4">
        <AdBanner position="GLOBAL_FOOTER" />
      </div>
      <footer className="bg-[#1a1a1a] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <div className="mb-6">
              <h2 className="text-xl font-noto font-black tracking-widest text-white uppercase">
                JEJU<span className="text-[#bc002d]">JAPAN</span>
              </h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
               Revolutionizing storytelling through AI-powered insights and high-quality journalism. Delivering truth at the speed of tech.
            </p>
            <div className="flex space-x-4">
               <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-[#bc002d] transition-colors">
                  <Globe size={14} />
               </div>
               <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-[#bc002d] transition-colors">
                  <Mail size={14} />
               </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#bc002d] mb-6">Explore</h4>
            <ul className="space-y-4 text-xs text-gray-400 font-medium">
               <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
               <li><Link href="/#latest-stories" className="hover:text-white transition-colors">Latest News</Link></li>
               <li><Link href="/#trending-stories" className="hover:text-white transition-colors">Trending</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#bc002d] mb-6">Company</h4>
            <ul className="space-y-4 text-xs text-gray-400 font-medium">
               <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
               <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
               <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
               <li><Link href="#" className="hover:text-white transition-colors">Advertise</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 bg-white/5 p-6 rounded-sm border border-white/10">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">Stay Connected</h4>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
               Join our community for AI-driven insights and the latest global news updates.
            </p>
            <button 
              onClick={onOpenNewsletter}
              className="w-full bg-white text-black px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
               Subscribe Now
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} Jeju Japan News Network. All rights reserved.</p>
          <div className="flex space-x-8">
             <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
             <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
             <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
