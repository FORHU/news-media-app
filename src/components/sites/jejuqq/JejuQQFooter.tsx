"use client";

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import { Twitter, Youtube, Facebook, Instagram } from "lucide-react";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string | null;
  positions: string[];
}

interface JejuQQFooterProps {
  onOpenNewsletter?: () => void;
  footerBanners?: Banner[];
}

export default function JejuQQFooter({ onOpenNewsletter, footerBanners }: JejuQQFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-[#fdf2f2]">
      <div className="max-w-7xl mx-auto px-4 w-full pt-4 mb-4">
        <AdBanner position="GLOBAL_FOOTER" />
      </div>
      <footer className="bg-[#fee2e2] border-t-4 border-[#dc2626] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="md:col-span-1">
             <div className="border-y-2 border-black py-2 px-3 mb-8 inline-block">
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-1">The Daily</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-garamond font-black tracking-tighter text-black italic">Jeju</span>
                    <span className="text-2xl font-garamond font-black tracking-tighter text-[#dc2626]">QQ</span>
                  </div>
                </div>
             </div>
             <div className="flex space-x-5 text-gray-400">
                <Twitter size={20} className="hover:text-[#dc2626] transition-colors cursor-pointer" />
                <Youtube size={20} className="hover:text-[#dc2626] transition-colors cursor-pointer" />
                <Facebook size={20} className="hover:text-[#dc2626] transition-colors cursor-pointer" />
                <Instagram size={20} className="hover:text-[#dc2626] transition-colors cursor-pointer" />
             </div>
          </div>

          <div>
             <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-[#dc2626] mb-8">National</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">Politics</Link></li>
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">Society</Link></li>
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">Environment</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-[#dc2626] mb-8">Business</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">Economy</Link></li>
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">Industry</Link></li>
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">Finance</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-[#dc2626] mb-8">Information</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[#dc2626] transition-colors">Terms of Service</Link></li>
             </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-[#dc2626]/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          <p>© {currentYear} Jeju QQ Daily. All rights reserved.</p>
          <div className="flex space-x-8">
             <Link href="#" className="hover:text-[#dc2626] transition-colors">Advertising</Link>
             <Link href="#" className="hover:text-[#dc2626] transition-colors">Careers</Link>
             <Link href="#" className="hover:text-[#dc2626] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
      </footer>
    </div>
  );
}
