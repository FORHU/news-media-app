"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewsletter?: () => void;
  categoryLinks: { name: string; link: string }[];
  overflowCategories: string[];
  categoryHref: (cat: string) => string;
}

export default function LavagueTechSidebar({ isOpen, onClose, onOpenNewsletter, categoryLinks, overflowCategories, categoryHref }: SidebarProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed inset-y-0 left-0 z-[70] w-80 max-w-[90vw] bg-white border-r border-gray-200 flex flex-col shadow-xl shadow-gray-900/10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <span className="text-gray-900 font-black text-lg tracking-tight">
            <span className="text-red-600">L</span>avague<span className="text-blue-700">T</span>ech
          </span>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-blue-700 transition-colors" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {categoryLinks.map(({ name, link }) => (
            <Link
              key={name}
              href={link}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors group"
            >
              {name}
              <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
            </Link>
          ))}

          {overflowCategories.length > 0 && (
            <>
              <div className="pt-4 pb-2 px-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">More Topics</span>
              </div>
              {overflowCategories.map((cat) => (
                <Link
                  key={cat}
                  href={categoryHref(cat)}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition-colors group"
                >
                  {cat}
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer actions */}
        <div className="px-6 py-5 border-t border-gray-200 space-y-3">
          <button
            onClick={() => { onClose(); onOpenNewsletter?.(); }}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 text-[11px] font-bold uppercase tracking-widest transition-colors"
          >
            Subscribe to Newsletter
          </button>
          <Link
            href="/admin/dashboard"
            onClick={onClose}
            className="block w-full text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-700 py-2 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </>
  );
}
