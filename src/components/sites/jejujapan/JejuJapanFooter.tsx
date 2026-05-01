"use client";

import Link from "next/link";
import { Globe, Mail, Phone, MapPin } from "lucide-react";

export default function JejuJapanFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <h1 className="text-2xl font-serif font-black tracking-tighter text-black mb-6">
               <span className="text-[#bc002d]">JEJU</span> JAPAN
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm">
               The premier source for Japanese-Jeju relations, business, and cultural exchange. Delivering precision journalism from across the sea.
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
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-6">Network</h4>
            <ul className="space-y-4 text-xs text-gray-500 font-medium">
               <li><Link href="#" className="hover:text-[#bc002d]">Tokyo Bureau</Link></li>
               <li><Link href="#" className="hover:text-[#bc002d]">Osaka Edition</Link></li>
               <li><Link href="#" className="hover:text-[#bc002d]">Jeju Hub</Link></li>
               <li><Link href="#" className="hover:text-[#bc002d]">Asia Report</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-6">Support</h4>
            <ul className="space-y-4 text-xs text-gray-500 font-medium">
               <li><Link href="#" className="hover:text-[#bc002d]">Subscription</Link></li>
               <li><Link href="#" className="hover:text-[#bc002d]">Help Center</Link></li>
               <li><Link href="#" className="hover:text-[#bc002d]">RSS Feeds</Link></li>
               <li><Link href="#" className="hover:text-[#bc002d]">Ad Info</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-6">Contact</h4>
            <ul className="space-y-4 text-xs text-gray-500 font-medium">
               <li className="flex items-center gap-3"><MapPin size={14} className="text-[#bc002d]" /> Marunouchi Business District, Tokyo</li>
               <li className="flex items-center gap-3"><Phone size={14} className="text-[#bc002d]" /> +81 (03) 1234-5678</li>
               <li className="flex items-center gap-3"><Mail size={14} className="text-[#bc002d]" /> bureau@jejujapan.com</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} Jeju Japan News Network. All rights reserved.</p>
          <div className="flex space-x-8">
             <Link href="#" className="hover:text-black">Privacy Policy</Link>
             <Link href="#" className="hover:text-black">Terms of Service</Link>
             <Link href="#" className="hover:text-black">Copyright</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
