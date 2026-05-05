"use client";

import Link from "next/link";
import Image from "next/image";
import { AdBanner } from "@/components/AdBanner";
import { Twitter, Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";

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

export default function JejuTimeFooter({ onOpenNewsletter, footerBanners }: FooterProps) {
  return (
    <>
      <div className="max-w-7xl mx-auto px-6 w-full mt-0 mb-0">
        <AdBanner position="GLOBAL_FOOTER" />
      </div>
      <footer className="bg-black border-t border-slate-800 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-4">
            <div className="mb-8">
              <div className="relative h-20 w-80 sm:h-28 sm:w-[400px]">
                <Image
                  src="/Logo/JEJUTIMELOGO.png"
                  alt="JejuTime Logo"
                  fill
                  className="object-contain object-left brightness-0 invert"
                  sizes="(max-width: 768px) 300px, 400px"
                />
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-8 font-light">
              Capturing the weightless essence of Jeju's volcanic soul and coastal rhythm. Premium journalism for the modern islander.
            </p>
            <div className="flex space-x-6 text-slate-300">
              <Twitter size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
              <Instagram size={18} className="hover:text-pink-400 cursor-pointer transition-colors" />
              <Facebook size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
              <Mail size={18} className="hover:text-orange-400 cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white mb-8">Explore</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li><Link href="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link href="/#latest-stories" className="hover:text-blue-400 transition-colors">Latest News</Link></li>
              <li><Link href="/#trending-stories" className="hover:text-blue-400 transition-colors">Trending</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white mb-8">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Advertise</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4 bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white mb-4">Stay Connected</h4>
            <p className="text-slate-400 text-sm mb-6 font-light leading-relaxed">
               Join our community for AI-driven insights and the latest global news updates.
            </p>
            <button 
              onClick={onOpenNewsletter}
              className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
               Subscribe Now
            </button>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 space-y-4 md:space-y-0">
          <p>© 2026 JejuTime. All rights reserved.</p>
          <div className="flex space-x-8">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
