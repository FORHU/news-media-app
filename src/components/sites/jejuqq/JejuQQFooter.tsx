"use client";

import Link from "next/link";
import Image from "next/image";
import { AdBanner } from "@/components/AdBanner";

interface JejuQQFooterProps {
  onOpenNewsletter?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function JejuQQFooter(_props: JejuQQFooterProps) {
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
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-[#b91c1c] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-[#b91c1c] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-[#b91c1c] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-[#b91c1c] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
             </div>
          </div>

          <div>
             <h4 className="font-bold font-serif text-[11px] uppercase tracking-[0.2em] text-[#b91c1c] mb-8">Browse</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="/search?category=%E6%B5%8E%E5%B7%9E%E4%BB%8A%E6%97%A5" className="hover:text-[#b91c1c] transition-colors">济州今日</Link></li>
                <li><Link href="/search?category=%E6%97%85%E6%B8%B8%E8%B5%84%E8%AE%AF" className="hover:text-[#b91c1c] transition-colors">旅游资讯</Link></li>
                <li><Link href="/search?category=%E7%BE%8E%E9%A3%9F%E9%A4%90%E5%8E%85" className="hover:text-[#b91c1c] transition-colors">美食餐厅</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold font-serif text-[11px] uppercase tracking-[0.2em] text-[#b91c1c] mb-8">Explore</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="/search?category=%E8%B4%AD%E7%89%A9%E5%B8%82%E5%9C%BA" className="hover:text-[#b91c1c] transition-colors">购物市场</Link></li>
                <li><Link href="/search?category=%E6%B4%BB%E5%8A%A8%E8%8A%82%E5%BA%86" className="hover:text-[#b91c1c] transition-colors">活动节庆</Link></li>
                <li><Link href="/search?category=%E8%87%AA%E7%84%B6%E6%88%B7%E5%A4%96" className="hover:text-[#b91c1c] transition-colors">自然户外</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold font-serif text-[11px] uppercase tracking-[0.2em] text-[#b91c1c] mb-8">Information</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                <li><Link href="/search" className="hover:text-[#b91c1c] transition-colors">All Articles</Link></li>
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-[#b91c1c] transition-colors">Contact</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[#b91c1c] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#b91c1c] transition-colors">Terms of Service</Link></li>
             </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-[#dc2626]/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          <p>© {currentYear} Jeju QQ Daily. All rights reserved.</p>
          <div className="flex space-x-8">
             <Link href="/privacy-policy" className="hover:text-[#b91c1c] transition-colors">Privacy Policy</Link>
             <Link href="/terms" className="hover:text-[#b91c1c] transition-colors">Terms</Link>
             <Link href="/search" className="hover:text-[#b91c1c] transition-colors">All Articles</Link>
          </div>
        </div>
      </div>
      </footer>
    </div>
  );
}
