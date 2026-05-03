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
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <h1 className="text-2xl font-serif font-black tracking-tighter text-black mb-6 flex flex-col">
               <span className="text-black"><span className="text-[#bc002d]">JEJU</span> JAPAN</span>
               <span className="text-[9px] font-bold tracking-[0.3em] text-gray-400 mt-1">NEWS NETWORK</span>
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm">
               Revolutionizing storytelling through AI-powered insights and high-quality journalism. Delivering truth at the speed of tech.
            </p>
            <div className="flex space-x-4">
               <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-[#bc002d] hover:text-white transition-colors">
                  <Globe size={14} />
               </div>
               <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-[#bc002d] hover:text-white transition-colors">
                  <Mail size={14} />
               </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#bc002d] mb-6">Explore</h4>
            <ul className="space-y-4 text-xs text-gray-500 font-medium">
               <li><Link href="/" className="hover:text-black transition-colors">Home</Link></li>
               <li><Link href="/#latest-stories" className="hover:text-black transition-colors">Latest News</Link></li>
               <li><Link href="/#trending-stories" className="hover:text-black transition-colors">Trending</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#bc002d] mb-6">Company</h4>
            <ul className="space-y-4 text-xs text-gray-500 font-medium">
               <li><Link href="#" className="hover:text-black transition-colors">About Us</Link></li>
               <li><Link href="#" className="hover:text-black transition-colors">Contact</Link></li>
               <li><Link href="#" className="hover:text-black transition-colors">Careers</Link></li>
               <li><Link href="#" className="hover:text-black transition-colors">Advertise</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 bg-gray-50 p-6 rounded-sm border border-gray-100">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-4">Stay Connected</h4>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
               Join our community for AI-driven insights and the latest global news updates.
            </p>
            <button 
              onClick={onOpenNewsletter}
              className="w-full bg-black text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#bc002d] transition-colors"
            >
               Subscribe Now
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} Jeju Japan News Network. All rights reserved.</p>
          <div className="flex space-x-8">
             <Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link>
             <Link href="#" className="hover:text-black transition-colors">Terms of Service</Link>
             <Link href="#" className="hover:text-black transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
