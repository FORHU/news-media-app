"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    alwaysShow?: boolean;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    alwaysShow = false,
}: PaginationProps) {
    const safeTotal = alwaysShow ? Math.max(1, totalPages) : totalPages;
    const safeCurrent = Math.max(1, Math.min(currentPage, safeTotal));

    if (!alwaysShow && safeTotal <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (safeTotal <= 7) {
            for (let i = 1; i <= safeTotal; i++) pages.push(i);
        } else {
            if (safeCurrent <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', safeTotal);
            } else if (safeCurrent >= safeTotal - 3) {
                pages.push(1, '...', safeTotal - 4, safeTotal - 3, safeTotal - 2, safeTotal - 1, safeTotal);
            } else {
                pages.push(1, '...', safeCurrent - 1, safeCurrent, safeCurrent + 1, '...', safeTotal);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-12 py-8 border-t border-gray-100">
            <button
                onClick={() => onPageChange(safeCurrent - 1)}
                disabled={safeTotal <= 1 || safeCurrent <= 1}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5">
                {getPageNumbers().map((page, index) =>
                    page === '...' ? (
                        <span key={`ellip-${index}`} className="w-10 text-center text-gray-400 font-bold">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page as number)}
                            className={`min-w-[40px] h-10 px-3 rounded-xl font-bold text-sm transition-all ${
                                safeCurrent === page
                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                                    : 'bg-white border border-gray-100 text-gray-500 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}
            </div>

            <button
                onClick={() => onPageChange(safeCurrent + 1)}
                disabled={safeTotal <= 1 || safeCurrent >= safeTotal}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
}
