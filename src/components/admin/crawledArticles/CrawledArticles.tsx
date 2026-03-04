"use client";

import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Globe, ArrowUpRight, Eye, Sparkles, X } from 'lucide-react';
import { CrawledArticlesHeader } from "./CrawledArticlesHeader";
import { CrawledArticlesFilterBar } from "./CrawledArticlesFilterbar";
import { CrawledArticlesTable } from "./CrawledArticlesTable";

interface CrawledArticleRow {
    id: number;
    title: string;
    url: string;
    source: string;
    date: string;
    dateValue: string | null; // ISO date (yyyy-mm-dd) for filtering
    content: string;
    imageUrl: string | null;
    status: string;
}

export default function CrawledArticles() {
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedArticle, setSelectedArticle] = useState<CrawledArticleRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "generated">("all");
    const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);

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
                    status: item.status ?? "pending",
                } satisfies CrawledArticleRow;
            });
        },
    });

    const errorMessage = error instanceof Error ? error.message : "";

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

        // Status filter (pending / processing / generated)
        if (statusFilter !== "all" && item.status !== statusFilter) {
            return false;
        }

        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageItems = filteredData.slice(startIndex, endIndex);

    const totalCount = crawledData.length;
    const pendingCount = crawledData.filter((item) => item.status === "pending").length;
    const processingCount = crawledData.filter((item) => item.status === "processing").length;
    const generatedCount = crawledData.filter((item) => item.status === "generated").length;

    const selectedPendingCount = selectedArticleIds.filter((id) => {
        const item = crawledData.find((r) => r.id === id);
        return item && item.status === "pending";
    }).length;

    const handleGenerateArticle = (row: CrawledArticleRow) => {
        // TODO: Implement actual AI generation API call
        if (typeof window !== "undefined" && (window as any).toast?.success) {
            (window as any).toast.success(`Generating AI article from: ${row.title}`, {
                description: "This will use the crawled content as context for AI generation.",
            });
        }
    };

    const handleBulkGenerate = () => {
        const selectedPending = crawledData.filter(
            (r) => selectedArticleIds.includes(r.id) && r.status === "pending"
        );
        // TODO: Implement actual bulk generation API call
        if (typeof window !== "undefined" && (window as any).toast?.success) {
            (window as any).toast.success(`Initiating bulk generation for ${selectedPending.length} articles`, {
                description: "AI will process selected articles in the background.",
            });
        }
        setSelectedArticleIds([]);
    };

    const pendingIdsOnCurrentPage = currentPageItems.filter((r) => r.status === "pending").map((r) => r.id);
    const allPendingOnPageSelected =
        pendingIdsOnCurrentPage.length > 0 &&
        pendingIdsOnCurrentPage.every((id) => selectedArticleIds.includes(id));

    const handleSelectAll = () => {
        if (allPendingOnPageSelected) {
            setSelectedArticleIds((prev) => prev.filter((id) => !pendingIdsOnCurrentPage.includes(id)));
        } else {
            setSelectedArticleIds((prev) => {
                const next = new Set(prev);
                pendingIdsOnCurrentPage.forEach((id) => next.add(id));
                return [...next];
            });
        }
    };

    const handleToggleArticle = (id: number) => {
        setSelectedArticleIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <CrawledArticlesHeader />

            {/* Status filters & stats section (based on ui.txt CrawledArticlesView) */}
            <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Total Crawled
                        </h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {totalCount}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl shadow-lg border border-yellow-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <h3 className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1.5">
                            Pending
                        </h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
                            {pendingCount}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl shadow-lg border border-blue-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1.5">
                            Processing
                        </h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            {processingCount}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl shadow-lg border border-green-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1.5">
                            Generated
                        </h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                            {generatedCount}
                        </p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1 space-y-3">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">
                                    View and manage articles crawled from web sources. Click on pending article rows or use checkboxes to select 2+ articles for bulk generation.
                                </p>
                                {selectedPendingCount >= 1 && selectedPendingCount < 2 && (
                                    <p className="text-xs text-yellow-600 font-semibold mt-1 flex items-center gap-1">
                                        <span>⚠️</span>
                                        <span>Select at least one more article to enable bulk generation (minimum 2 required)</span>
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    Status:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("all")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${statusFilter === "all"
                                        ? "bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    All ({totalCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("pending")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${statusFilter === "pending"
                                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md"
                                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                        }`}
                                >
                                    Pending ({pendingCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("processing")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${statusFilter === "processing"
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        }`}
                                >
                                    Processing ({processingCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("generated")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${statusFilter === "generated"
                                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                                        : "bg-green-50 text-green-700 hover:bg-green-100"
                                        }`}
                                >
                                    Generated ({generatedCount})
                                </button>
                            </div>
                        </div>
                        {/* Selection actions: Generate Selected, Clear */}
                        <div className="flex items-center gap-3">
                            {selectedPendingCount > 0 && (
                                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold border border-blue-200">
                                    {selectedPendingCount} Selected
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleBulkGenerate}
                                disabled={selectedPendingCount < 2}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-md whitespace-nowrap ${
                                    selectedPendingCount >= 2
                                        ? "bg-gradient-to-r from-[#ff4500] to-[#ff6b35] text-white hover:shadow-lg hover:scale-105 cursor-pointer"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                }`}
                            >
                                <Sparkles className={`w-5 h-5 ${selectedPendingCount >= 2 ? "animate-pulse" : ""}`} />
                                <span>Generate Selected {selectedPendingCount > 0 ? `(${selectedPendingCount})` : ""}</span>
                            </button>
                            {selectedPendingCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedArticleIds([])}
                                    className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Clear</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                
            </div>
            <CrawledArticlesFilterBar
                searchQuery={searchQuery}
                startDate={startDate}
                endDate={endDate}
                onSearchChange={setSearchQuery}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClearDates={() => {
                    setStartDate("");
                    setEndDate("");
                }}
            />

            

            {/* Content Table */}
            <CrawledArticlesTable
                rows={currentPageItems}
                totalCount={filteredData.length}
                isLoading={loading}
                errorMessage={errorMessage}
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={itemsPerPage}
                selectedArticleIds={selectedArticleIds}
                onToggleArticle={handleToggleArticle}
                onSelectAll={handleSelectAll}
                allPendingOnPageSelected={allPendingOnPageSelected}
                pendingCountOnPage={pendingIdsOnCurrentPage.length}
                onPageChange={(page) => setCurrentPage(page)}
                onItemsPerPageChange={(count) => {
                    setItemsPerPage(count);
                    setCurrentPage(1);
                }}
                onView={(row) => {
                    setSelectedArticle(row);
                    setIsModalOpen(true);
                }}
                onGenerate={handleGenerateArticle}
            />

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

