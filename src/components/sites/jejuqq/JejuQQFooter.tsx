"use client";

import Link from "next/link";
import Image from "next/image";
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
      <footer className="bg-[#fee2e2] border-t-4 border-primary pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="md:col-span-1">
              <div className="mb-8">
                 <div className="relative h-20 w-64 shrink-0 -ml-1 transition-all duration-300">
                    <Image
                      src="/Logo/JEJUQQLOGO.png"
                      alt="JejuQQ Logo"
                      fill
                      className="object-contain object-left scale-110"
                    />
                 </div>
              </div>
             <div className="flex space-x-5 text-gray-600">
                <Twitter size={20} className="hover:text-[#b91c1c] transition-colors cursor-pointer" />
                <Youtube size={20} className="hover:text-[#b91c1c] transition-colors cursor-pointer" />
                <Facebook size={20} className="hover:text-[#b91c1c] transition-colors cursor-pointer" />
                <Instagram size={20} className="hover:text-[#b91c1c] transition-colors cursor-pointer" />
             </div>
          </div>

          <div>
             <h4 className="font-bold font-serif text-[11px] uppercase tracking-[0.2em] text-[#b91c1c] mb-8">National</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">Society</Link></li>
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">Environment</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold font-serif text-[11px] uppercase tracking-[0.2em] text-[#b91c1c] mb-8">Business</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">Economy</Link></li>
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">Industry</Link></li>
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">Finance</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold font-serif text-[11px] uppercase tracking-[0.2em] text-[#b91c1c] mb-8">Information</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">Terms of Service</Link></li>
             </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-[#dc2626]/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          <p>© {currentYear} Jeju QQ Daily. All rights reserved.</p>
          <div className="flex space-x-8">
             <Link href="#" className="hover:text-[#b91c1c] transition-colors">Advertising</Link>
             <Link href="#" className="hover:text-[#b91c1c] transition-colors">Careers</Link>
             <Link href="#" className="hover:text-[#b91c1c] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
      </footer>
    </div>
  );
}
