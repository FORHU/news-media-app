"use client";

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";

const EXPLORE_LINKS = [
    { label: "Home", href: "/" },
    { label: "Latest News", href: "/#latest-stories" },
    { label: "Trending", href: "/#trending-stories" },
];

const COMPANY_LINKS = [
    { label: "About Us", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Advertise", href: "#" },
];

const LEGAL_LINKS = [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
];

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

export function Footer({ onOpenNewsletter, footerBanners }: FooterProps) {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2 -mt-4">
                <AdBanner position="GLOBAL_FOOTER" initialBanners={footerBanners} />
            </div>
            <footer className="bg-[#1a1a1a] text-white border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 sm:mb-16">
                        {/* Explore Column */}
                        <div>
                            <h3 className="text-[#ff4500] font-bold text-xs uppercase tracking-[0.2em] mb-6">
                                Explore
                            </h3>
                            <ul className="space-y-4">
                                {EXPLORE_LINKS.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-400 hover:text-white text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company Column */}
                        <div>
                            <h3 className="text-[#ff4500] font-bold text-xs uppercase tracking-[0.2em] mb-6">
                                Company
                            </h3>
                            <ul className="space-y-4">
                                {COMPANY_LINKS.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-400 hover:text-white text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal Column */}
                        <div>
                            <h3 className="text-[#ff4500] font-bold text-xs uppercase tracking-[0.2em] mb-6">
                                Legal
                            </h3>
                            <ul className="space-y-4">
                                {LEGAL_LINKS.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-400 hover:text-white text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Subscription / Info Column */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                                Stay Connected
                            </h3>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                Join our community for AI-driven insights and the latest global news updates.
                            </p>
                            <button
                                type="button"
                                onClick={() => onOpenNewsletter?.()}
                                className="w-full bg-[#ff4500] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e03d00] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#ff4500]/20"
                            >
                                SUBSCRIBE NOW
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-800 pt-10">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* Logo & Copyright */}
                            <div className="text-center lg:text-left max-w-md">
                                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-4 justify-center lg:justify-start">
                                    <span className="font-black text-3xl tracking-tighter text-[#ff4500]">NEWSICONS</span>
                                    <span className="hidden sm:block h-6 w-px bg-gray-700"></span>
                                    <span className="text-gray-400 text-sm font-medium">Next-Gen Media Hub</span>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                    Revolutionizing storytelling through AI-powered insights and high-quality journalism. Delivering truth at the speed of tech.
                                </p>
                                <p className="text-gray-600 text-xs">
                                    © {currentYear} NEWSICONS. All rights reserved.
                                </p>
                            </div>

                            {/* Social Links */}
                            <div className="flex items-center gap-6">
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#ff4500] hover:bg-white/10 transition-all duration-300 border border-white/5"
                                    aria-label="Twitter"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#ff4500] hover:bg-white/10 transition-all duration-300 border border-white/5"
                                    aria-label="LinkedIn"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#ff4500] hover:bg-white/10 transition-all duration-300 border border-white/5"
                                    aria-label="Facebook"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#ff4500] hover:bg-white/10 transition-all duration-300 border border-white/5"
                                    aria-label="Instagram"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
