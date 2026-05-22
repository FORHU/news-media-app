"use client";

import { X, Mail, User, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { RemoveScroll } from "react-remove-scroll";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewsletter?: () => void;
  categoryLinks: { name: string; link: string }[];
  overflowCategories: string[];
  categoryHref: (name: string) => string;
}

export default function JejuTimeSidebar({
  isOpen,
  onClose,
  onOpenNewsletter,
  categoryLinks,
  overflowCategories,
  categoryHref,
}: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <RemoveScroll enabled={isOpen}>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 h-[100dvh] w-full sm:w-80 max-w-[85vw] bg-white z-[70] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="flex-shrink-0 bg-black h-16 px-5 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="p-1.5 text-blue-200 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="relative h-14 w-56 shrink-0 transition-all duration-300 -ml-1">
                  <Image
                    src="/Logo/JEJUTIMELOGO.png"
                    alt="JejuTime Logo"
                    fill
                    className="object-contain object-center brightness-0 invert scale-110"
                    sizes="250px"
                  />
                </div>
                <div className="w-8" />
              </div>

              {/* Blue accent strip */}
              <div className="h-[3px] bg-gradient-to-r from-blue-600 via-blue-400 to-transparent flex-shrink-0" />

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 px-7 pt-5 pb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600">Sections</span>
                </div>
                <nav>
                  {categoryLinks.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.link}
                      onClick={onClose}
                      className="group flex items-stretch border-b border-slate-100 hover:bg-blue-50/60 transition-all duration-200"
                    >
                      <span className="w-[3px] shrink-0 bg-transparent group-hover:bg-blue-600 transition-colors" />
                      <span className="flex-1 pl-5 pr-4 py-3 text-[15px] font-mono font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                  {overflowCategories.length > 0 && (
                    <details className="group/details">
                      <summary className="flex items-center justify-between px-7 py-3 text-[15px] font-mono font-bold text-slate-800 hover:text-blue-600 border-b border-slate-100 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span>More</span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover/details:text-blue-600 group-open/details:rotate-180 transition-transform" />
                      </summary>
                      <div className="bg-blue-50/40">
                        {overflowCategories.map((name) => (
                          <Link
                            key={name}
                            href={categoryHref(name)}
                            onClick={onClose}
                            className="block px-10 py-2.5 text-sm text-slate-600 hover:text-blue-600 border-b border-slate-100 transition-colors"
                          >
                            {name}
                          </Link>
                        ))}
                      </div>
                    </details>
                  )}
                </nav>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 bg-blue-50 border-t border-blue-100 p-5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewsletter?.();
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-blue-600 text-white text-xs font-baskerville font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md shadow-blue-200 transition-all mb-3"
                >
                  <Mail className="w-4 h-4" />
                  Subscribe
                </button>

                <Link
                  href="/admin/dashboard"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-white text-slate-600 text-xs font-bold border border-blue-100 uppercase tracking-widest hover:bg-blue-50 hover:border-blue-200 transition-all mb-5"
                >
                  <User className="w-4 h-4" />
                  Admin Panel
                </Link>
                <div className="text-center">
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-3">Follow Us</p>
                  <div className="flex items-center justify-center gap-5">
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </RemoveScroll>
        </>
      )}
    </AnimatePresence>
  );
}
