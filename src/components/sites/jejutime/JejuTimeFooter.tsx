"use client";

import Link from "next/link";
import { Twitter, Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";

interface FooterProps {
  onOpenNewsletter?: () => void;
}

export default function JejuTimeFooter({ onOpenNewsletter }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-playfair font-black tracking-tighter text-blue-950 mb-6">
              Jeju <span className="text-blue-600/80">Times</span>
            </h2>
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
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-8">Navigation</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-light">
              <li><Link href="#" className="hover:text-blue-600">The Dispatch</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Currents</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Volcanic Life</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Coastal Rhythms</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-8">Journal</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-light">
              <li><Link href="#" className="hover:text-blue-600">About Us</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Masthead</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Ethics</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Careers</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-8">Contact</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-light">
              <li className="flex items-center gap-3"><MapPin size={14} /> Seogwipo Coastal Hub, Jeju</li>
              <li className="flex items-center gap-3"><Mail size={14} /> editor@jejutimes.com</li>
              <li className="flex items-center gap-3"><Phone size={14} /> +82 064 123 4567</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-50 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-300 space-y-4 md:space-y-0">
          <p>© 2026 Jeju Times. All rights reserved.</p>
          <div className="flex space-x-8">
            <Link href="#" className="hover:text-slate-600">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-600">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-600">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
