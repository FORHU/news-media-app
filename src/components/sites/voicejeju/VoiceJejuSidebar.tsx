"use client";

import { X, Mail, User, ChevronDown } from "lucide-react";
import Link from "next/link";
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

export function VoiceJejuSidebar({
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
              className="fixed left-0 top-0 h-[100dvh] w-full sm:w-80 max-w-[85vw] bg-zinc-950 z-[70] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="flex-shrink-0 border-b border-white/10 h-16 px-5 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="relative shrink-0 transition-all duration-300">
                  <span className="text-white text-2xl font-normal font-voltaire">VoiceJeju</span>
                </div>
                <div className="w-8" />
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto">
                <nav className="py-2">
                  {categoryLinks.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.link}
                      onClick={onClose}
                      className="block px-7 py-3 text-[13px] font-inter font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/5 border-b border-white/5 border-l-2 border-l-transparent hover:border-l-white transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  {overflowCategories.length > 0 && (
                    <details className="group">
                      <summary className="flex items-center justify-between px-7 py-3 text-[13px] font-inter font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/5 border-b border-white/5 border-l-2 border-l-transparent hover:border-l-white transition-all cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span>More</span>
                        <ChevronDown className="w-4 h-4 text-zinc-600 group-hover:text-white group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="bg-white/5">
                        {overflowCategories.map((name) => (
                           <Link
                            key={name}
                            href={categoryHref(name)}
                            onClick={onClose}
                            className="block px-10 py-2.5 text-sm font-inter text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
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
              <div className="flex-shrink-0 border-t border-white/10 p-5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewsletter?.();
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black text-xs font-inter font-bold uppercase tracking-widest hover:bg-zinc-100 transition-all mb-3 rounded-none"
                >
                  <Mail className="w-4 h-4" />
                  Subscribe
                </button>

                <Link
                  href="/admin/dashboard"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-transparent text-zinc-400 text-xs font-inter font-bold border border-zinc-700 uppercase tracking-widest hover:bg-white/5 hover:text-zinc-200 transition-all mb-6 rounded-none"
                >
                  <User className="w-4 h-4" />
                  Admin Panel
                </Link>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-3">Follow Us</p>
                  <div className="flex items-center justify-center gap-5">
                    <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                    <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
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
