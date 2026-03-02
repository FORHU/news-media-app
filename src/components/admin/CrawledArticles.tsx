"use client";

import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
    Search,
    Filter,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Globe,
    ExternalLink,
    FileText,
    Newspaper,
    Calendar,
    ArrowUpRight,
    Eye
} from 'lucide-react';

interface CrawledArticleRow {
    id: number;
    title: string;
    url: string;
    source: string;
    date: string;
    dateValue: string | null; // ISO date (yyyy-mm-dd) for filtering
    content: string;
    imageUrl: string | null;
}

export default function CrawledArticles() {
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedArticle, setSelectedArticle] = useState<CrawledArticleRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        data: crawledData = [],
        isLoading: loading,
        error,
    } = useQuery<CrawledArticleRow[], Error>({
        queryKey: ["admin", "raw-articles"],
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        queryFn: async () => {
            const res = await fetch("/api/routes/admin/raw-articles");
            if (!res.ok) {
                throw new Error("Failed to fetch");
            }
            const data = await res.json();
            return (data ?? []).map((item: any) => {
                const url: string = item?.crawledUrl?.url ?? "";
                const source = url || "Unknown source";

                // Use createdAt as the canonical crawl date
                const crawlDate: string | null = item?.createdAt ?? null;

                let dateLabel = "—";
                let dateValue: string | null = null;

                if (crawlDate) {
                    const d = new Date(crawlDate);
                    if (!Number.isNaN(d.getTime())) {
                        dateLabel = d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        });
                        // yyyy-mm-dd for <input type="date">
                        dateValue = d.toISOString().slice(0, 10);
                    }
                }

                return {
                    id: item.id,
                    title: item.title ?? "Untitled",
                    url,
                    source,
                    date: dateLabel,
                    dateValue,
                    content: item.content ?? "",
                    imageUrl: item.imageUrl ?? null,
                } satisfies CrawledArticleRow;
            });
        },
    });

    const errorMessage =
        error instanceof Error ? error.message : "Failed to load crawled articles.";

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const filteredData = crawledData.filter((item) => {
        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchesText =
                item.title.toLowerCase().includes(q) ||
                item.source.toLowerCase().includes(q) ||
                item.url.toLowerCase().includes(q);
            if (!matchesText) return false;
        }

        // Date range filter (inclusive, based on crawl date)
        if (startDate || endDate) {
            // If a range is selected but we have no crawl date, exclude the item
            if (!item.dateValue) return false;

            if (startDate && item.dateValue < startDate) return false;
            if (endDate && item.dateValue > endDate) return false;
        }

        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageItems = filteredData.slice(startIndex, endIndex);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6 mb-6">

{/* Left Side */}
<div>
    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
        Crawled Articles
    </h1>
    <p className="text-sm text-gray-500 mt-1">
        Review and manage articles discovered by the automated crawler
    </p>
</div>

</div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search crawled articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#ff4500]"
                            />
                            <span className="text-xs text-gray-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#ff4500]"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setCurrentPage(1);
                                }}
                                className="ml-3 text-[11px] font-medium text-gray-500 hover:text-gray-800"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-[#fafafa] border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Article Information</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Source</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Crawl Status</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Crawl Date</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-16 text-center text-sm text-gray-500">
                                    Loading crawled articles...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-16 text-center text-sm text-red-600">
                                    {errorMessage}
                                </td>
                            </tr>
                        ) : filteredData.length > 0 ? (
                            currentPageItems.map((item) => (
                                <tr
                                    key={item.id}
                                    className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200"
                                >
                                    {/* Article information */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <img
                                                src={item.imageUrl ?? `https://placehold.co/96x96/e5e7eb/9ca3af?text=${encodeURIComponent(item.title.slice(0, 12) || "RAW")}`}
                                                alt={item.title}
                                                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl shadow-md flex-shrink-0 bg-gray-100"
                                            />
                                            <div>
                                                <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
                                                    {item.title}
                                                </p>
                                                <p className="text-[11px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5 font-medium break-all">
                                                    {item.url || "No source URL"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Source */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                                        {item.url ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    window.open(item.url, "_blank", "noopener,noreferrer");
                                                }}
                                                className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm max-w-[200px] truncate hover:from-gray-200 hover:to-gray-300 transition-colors"
                                            >
                                                <Globe className="w-3 h-3 mr-1 text-gray-500" />
                                                {item.source || item.url}
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-gray-100 text-gray-500 shadow-sm max-w-[200px] truncate">
                                                <Globe className="w-3 h-3 mr-1 text-gray-400" />
                                                Unknown source
                                            </span>
                                        )}
                                    </td>

                                    {/* Crawl status */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold shadow-sm bg-gradient-to-r from-green-500 to-green-600 text-white">
                                            Successfully Crawled
                                        </span>
                                    </td>

                                    {/* Crawl date */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-xs sm:text-sm text-gray-600 font-medium">
                                        {item.dateValue ?? "—"}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center justify-center">
                                        <button
                                        onClick={() => {
                                            setSelectedArticle(item);
                                            setIsModalOpen(true);
                                        }}
                                        className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                                        >
                                        <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
                                            <Newspaper className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-gray-900">No Articles Yet</h3>
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                                No articles have been crawled yet. Check your source configurations or trigger a manual crawl.
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {filteredData.length > 0 && (
                    <div className="px-6 sm:px-8 py-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            {/* Left: Items count */}
                            <div className="text-sm text-gray-500">
                                {startIndex + 1}–
                                {Math.min(endIndex, filteredData.length)} of {filteredData.length}
                            </div>

                            {/* Center: Page Navigation */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-md transition-colors ${
                                        currentPage === 1
                                            ? "text-gray-300 cursor-not-allowed"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="px-3 text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </div>

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-md transition-colors ${
                                        currentPage === totalPages
                                            ? "text-gray-300 cursor-not-allowed"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Right: Items per page selector */}
                            <div className="flex items-center gap-1">
                                {[5, 10, 15].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => {
                                            setItemsPerPage(count);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                                            itemsPerPage === count
                                                ? "bg-[#ff4500] text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && selectedArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">
                                    Crawled Article Preview
                                </p>
                                <h2 className="text-lg font-bold text-gray-900 line-clamp-2">
                                    {selectedArticle.title}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <Globe className="w-3 h-3" />
                                    <span>{selectedArticle.source}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{selectedArticle.date}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="ml-4 inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                aria-label="Close"
                            >
                                <span className="text-xl leading-none">&times;</span>
                            </button>
                        </div>

                        <div className="px-6 py-4 overflow-y-auto text-sm text-gray-800 space-y-4">
                            {selectedArticle.imageUrl && (
                                <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                    <img
                                        src={selectedArticle.imageUrl}
                                        alt={selectedArticle.title}
                                        className="w-full h-auto max-h-80 object-cover"
                                    />
                                </div>
                            )}

                            {selectedArticle.content ? (
                                <div
                                    className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                                />
                            ) : (
                                <div className="text-sm text-gray-500">
                                    No content available for this article.
                                </div>
                            )}
                        </div>

                        {selectedArticle.url && (
                            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                                <span className="truncate">
                                    Original URL:{" "}
                                    <a
                                        href={selectedArticle.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#ff4500] hover:underline"
                                    >
                                        {selectedArticle.url}
                                    </a>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.open(
                                            selectedArticle.url,
                                            "_blank",
                                            "noopener,noreferrer"
                                        );
                                    }}
                                    className="ml-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white hover:bg-[#ff4500] transition-colors"
                                >
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span className="text-[11px] font-semibold tracking-wide uppercase">
                                        Open Source
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


