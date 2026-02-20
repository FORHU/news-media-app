"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RemoveScroll } from "react-remove-scroll";

interface SideBarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenNewsletter?: () => void;
}

function categoryHref(categoryName: string) {
    return `/?category=${encodeURIComponent(categoryName)}`;
}

const CATEGORY_STRUCTURE = [
    { name: "Latest News", link: "/", subcategories: [] },
    {
        name: "News & Current Events",
        subcategories: [
            { name: "World News", link: categoryHref("World News") },
            { name: "Local Updates", link: categoryHref("Local Updates") },
        ],
    },
    {
        name: "Business & Technology",
        subcategories: [
            { name: "Markets", link: categoryHref("Markets") },
            { name: "Startups", link: categoryHref("Startups") },
            { name: "AI & Innovation", link: categoryHref("AI & Innovation") },
        ],
    },
    {
        name: "Lifestyle",
        subcategories: [
            { name: "Health & Wellness", link: categoryHref("Health & Wellness") },
            { name: "Travel", link: categoryHref("Travel") },
        ],
    },
    {
        name: "Entertainment & Sports",
        subcategories: [
            { name: "Entertainment & Culture", link: categoryHref("Entertainment & Culture") },
            { name: "Sports & Fitness", link: categoryHref("Sports & Fitness") },
            { name: "Automotive", link: categoryHref("Automotive") },
        ],
    },
    {
        name: "Personal Growth",
        subcategories: [
            { name: "Education & Learning", link: categoryHref("Education & Learning") },
            { name: "Personal Development", link: categoryHref("Personal Development") },
        ],
    },
    {
        name: "Opinion & Creative",
        subcategories: [
            { name: "Editorials/Opinions", link: categoryHref("Editorials/Opinions") },
            { name: "Creative Writing", link: categoryHref("Creative Writing") },
            { name: "DIY and How to", link: categoryHref("DIY and How to") },
        ],
    },
];

export function SideBar({ isOpen, onClose, onOpenNewsletter }: SideBarProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    const toggleCategory = (name: string) => {
        setExpandedCategories((prev) =>
            prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
        );
    };

    const handlePlaceholderClick = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[60]"
                        onClick={onClose}
                    />

                    {/* Sidebar Drawer */}
                    <RemoveScroll enabled={isOpen}>
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 h-screen w-full sm:w-80 max-w-[85vw] landscape:sm:w-72 bg-white z-[70] shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex-shrink-0 bg-black h-14 md:h-16 px-4 flex items-center justify-between">
                                <button
                                    onClick={onClose}
                                    className="p-2 text-white hover:text-[#ff4500] transition-colors"
                                    aria-label="Close menu"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <span className="text-xl font-bold text-white tracking-widest uppercase">Menu</span>
                                <div className="w-10"></div>
                            </div>

                            {/* Navigation Links - Scrollable */}
                            <div className="flex-1 overflow-y-auto scrollbar-hide pt-4">
                                <nav className="pb-12">
                                    {CATEGORY_STRUCTURE.map((category, index) => (
                                        <div key={index}>
                                            {category.subcategories.length === 0 ? (
                                                <Link
                                                    href={category.link!}
                                                    onClick={onClose}
                                                    className="block px-8 py-4 text-lg text-gray-900 hover:bg-[#ff4500]/5 hover:text-[#ff4500] transition-all font-semibold"
                                                >
                                                    {category.name}
                                                </Link>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => toggleCategory(category.name)}
                                                        className="w-full flex items-center justify-between px-8 py-4 text-lg text-gray-900 hover:bg-[#ff4500]/5 hover:text-[#ff4500] transition-all font-bold text-left"
                                                    >
                                                        <span>{category.name}</span>
                                                        <motion.div
                                                            animate={{ rotate: expandedCategories.includes(category.name) ? 90 : 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                                        </motion.div>
                                                    </button>

                                                    <AnimatePresence>
                                                        {expandedCategories.includes(category.name) && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                className="bg-gray-50 overflow-hidden"
                                                            >
                                                                {category.subcategories.map((sub, subIndex) => (
                                                                    <Link
                                                                        key={subIndex}
                                                                        href={sub.link}
                                                                        onClick={onClose}
                                                                        className="block px-8 py-3 pl-14 text-base text-gray-700 hover:bg-[#ff4500]/10 hover:text-[#ff4500] transition-all"
                                                                    >
                                                                        {sub.name}
                                                                    </Link>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                            </div>

                            {/* Sticky Footer - Newsletter & Social Links */}
                            <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 sm:p-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenNewsletter?.();
                                    }}
                                    className="w-full flex flex-row landscape:flex-row sm:flex-col items-center justify-center gap-3 sm:gap-2 py-2 sm:py-5 rounded-2xl bg-black transition-transform active:scale-95 hover:bg-gray-800 mb-2 sm:mb-6 group cursor-pointer"
                                >
                                    <motion.div
                                        animate={{ y: [0, -2, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="v-short:hidden"
                                    >
                                        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-[#ff4500] transition-colors" />
                                    </motion.div>
                                    <span className="text-sm sm:text-base font-bold text-white uppercase tracking-widest v-short:text-xs">Newsletter</span>
                                </button>

                                <div className="text-center">
                                    <p className="text-xs text-[#ff4500] font-black uppercase tracking-[0.2em] mb-4">Follow Us</p>
                                    <div className="flex items-center justify-center gap-8">
                                        <a href="#" onClick={handlePlaceholderClick} className="text-gray-800 hover:text-[#ff4500] transition-all transform hover:scale-110">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </a>
                                        <a href="#" onClick={handlePlaceholderClick} className="text-gray-800 hover:text-[#ff4500] transition-all transform hover:scale-110">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </a>
                                        <a href="#" onClick={handlePlaceholderClick} className="text-gray-800 hover:text-[#ff4500] transition-all transform hover:scale-110">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                            </svg>
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
