"use client";

import Link from "next/link";
import { Twitter, Youtube, Facebook, Instagram } from "lucide-react";

interface JejuQQFooterProps {
  onOpenNewsletter?: () => void;
}

export default function JejuQQFooter({ onOpenNewsletter }: JejuQQFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f8f8f8] border-t-2 border-black pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
             <div className="flex flex-col leading-none mb-6">
                <span className="text-[32px] font-serif font-black tracking-tighter text-black">Jeju</span>
                <span className="text-[26px] font-serif font-black tracking-tighter text-black -mt-2">QQ Daily</span>
             </div>
             <div className="flex space-x-4 text-gray-400">
                <Twitter size={18} className="hover:text-[#ff4500] cursor-pointer" />
                <Youtube size={18} className="hover:text-[#ff4500] cursor-pointer" />
                <Facebook size={18} className="hover:text-[#ff4500] cursor-pointer" />
                <Instagram size={18} className="hover:text-[#ff4500] cursor-pointer" />
             </div>
          </div>

          <div>
             <h4 className="font-bold text-sm mb-6 border-b border-gray-200 pb-2">National</h4>
             <ul className="space-y-3 text-xs text-gray-500">
                <li><Link href="#" className="hover:text-[#ff4500]">Politics</Link></li>
                <li><Link href="#" className="hover:text-[#ff4500]">Society</Link></li>
                <li><Link href="#" className="hover:text-[#ff4500]">Environment</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold text-sm mb-6 border-b border-gray-200 pb-2">Business</h4>
             <ul className="space-y-3 text-xs text-gray-500">
                <li><Link href="#" className="hover:text-[#ff4500]">Economy</Link></li>
                <li><Link href="#" className="hover:text-[#ff4500]">Industry</Link></li>
                <li><Link href="#" className="hover:text-[#ff4500]">Finance</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold text-sm mb-6 border-b border-gray-200 pb-2">Information</h4>
             <ul className="space-y-3 text-xs text-gray-500">
                <li><Link href="#" className="hover:text-[#ff4500]">About Us</Link></li>
                <li><Link href="#" className="hover:text-[#ff4500]">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[#ff4500]">Terms of Service</Link></li>
             </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-400">
          <p>© {currentYear} Jeju QQ Daily. All rights reserved.</p>
          <div className="flex space-x-6 uppercase font-bold tracking-tighter">
             <Link href="#">Advertising</Link>
             <Link href="#">Careers</Link>
             <Link href="#">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
