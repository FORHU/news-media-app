"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import type { Article } from "@/lib/types";
import {
    Plus,
    Search,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    Sparkles,
    FileText,
    Play,
    Eye,
} from "lucide-react";

interface GeneratedRow {
    id: number;
    title: string;
    imageUrl: string | null;
    category: string;
    type: string;
    createdAtLabel: string;
    createdAtValue: string | null; // yyyy-mm-dd for filtering
    content: string;
}

export default function GeneratedArticles() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [selectedArticle, setSelectedArticle] = useState<GeneratedRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{
        title: string;
        category: string;
        type: string;
        content: string;
        imageUrl: string | null;
    } | null>(null);

    const {
        data: articles = [],
        isLoading: loading,
        error,
    } = useQuery<Article[], Error>({
        queryKey: ["admin", "generated-articles"],
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        queryFn: () => articlesApi.getArticles({ limit: 100 }),
    });

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const {
        data: categories = [],
    } = useQuery<{ id: number; name: string }[], Error>({
        queryKey: ["admin", "categories"],
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        queryFn: async () => {
            const res = await fetch("/api/routes/categories");
            if (!res.ok) throw new Error("Failed to load categories");
            return res.json();
        },
    });

    const rows: GeneratedRow[] = (articles ?? []).map((article) => {
        const created = new Date(article.createdAt);
        let createdAtLabel = "—";
        let createdAtValue: string | null = null;

        if (!Number.isNaN(created.getTime())) {
            createdAtLabel = created.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            createdAtValue = created.toISOString().slice(0, 10); // yyyy-mm-dd
        }

        return {
            id: article.id,
            title: article.title,
            imageUrl: article.imageUrl ?? null,
            category: article.category.categoryName,
            type: article.status || "article",
            createdAtLabel,
            createdAtValue,
            content: article.content ?? "",
        };
    });

    const filteredRows = rows.filter((row) => {
        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchesText =
                row.title.toLowerCase().includes(q) ||
                row.category.toLowerCase().includes(q) ||
                row.type.toLowerCase().includes(q);
            if (!matchesText) return false;
        }

        // Category filter
        if (selectedCategory !== "all") {
            if (row.category !== selectedCategory) return false;
        }

        // Date range filter (inclusive, based on createdAtValue)
        if (startDate || endDate) {
            if (!row.createdAtValue) return false;
            if (startDate && row.createdAtValue < startDate) return false;
            if (endDate && row.createdAtValue > endDate) return false;
        }

        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageRows = filteredRows.slice(startIndex, endIndex);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6 mb-6">

                {/* Left Side */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Generated Article Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage, review, and organize AI-generated articles
                    </p>
                </div>

            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                </div>

                {/* Category filter */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Category
                        </span>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer"
                        >
                            <option value="all">All</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date range */}
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


            {/* Table Container */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-[#fafafa] border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Article
                            </th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Category
                            </th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Type
                            </th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                                AI
                            </th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Date
                            </th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-16 text-center text-sm text-gray-500">
                                    Loading generated articles...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-16 text-center text-sm text-red-600">
                                    {error.message}
                                </td>
                            </tr>
                        ) : filteredRows.length > 0 ? (
                            currentPageRows.map((article) => (
                                <tr
                                    key={article.id}
                                    className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200"
                                >
                                    {/* Article info */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <img
                                                src={
                                                    article.imageUrl ??
                                                    `https://placehold.co/96x96/e5e7eb/9ca3af?text=${encodeURIComponent(
                                                        article.title.slice(0, 12) || "POST"
                                                    )}`
                                                }
                                                alt={article.title}
                                                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl shadow-md flex-shrink-0 bg-gray-100"
                                            />
                                            <div>
                                                <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
                                                    {article.title}
                                                </p>
                                                <p className="text-[11px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5 font-medium">
                                                    {article.type.toLowerCase() === "blog" ? "Blog post" : "News article"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm max-w-[180px] truncate">
                                            {article.category}
                                        </span>
                                    </td>

                                    {/* Type */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold shadow-sm ${
                                                article.type.toLowerCase() === "news"
                                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                                    : "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                                            }`}
                                        >
                                            {article.type}
                                        </span>
                                    </td>

                                    {/* AI indicator */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                                        <div className="flex justify-center">
                                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff4500]" />
                                        </div>
                                    </td>

                                    {/* Date */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-xs sm:text-sm text-gray-600 font-medium">
                                        {article.createdAtLabel}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2 sm:gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedArticle(article);
                                                    setEditForm({
                                                        title: article.title,
                                                        category: article.category,
                                                        type: article.type,
                                                        content: article.content,
                                                        imageUrl: article.imageUrl,
                                                    });
                                                    setIsEditing(false);
                                                    setIsModalOpen(true);
                                                }}
                                                aria-label="View article"
                                                className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // TODO: wire up delete to backend when available
                                                    console.warn("Delete not implemented yet for article", article.id);
                                                }}
                                                aria-label="Delete article"
                                                className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                                        <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center">
                                            <Play className="w-8 h-8 text-[#ff4500] fill-[#ff4500]" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-gray-900">Get Started</h3>
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                                No generated articles found. Click &apos;Create New&apos; to begin.
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {filteredRows.length > 0 && (
                    <div className="px-6 sm:px-8 py-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            {/* Left: Items count */}
                            <div className="text-sm text-gray-500">
                                {startIndex + 1}–
                                {Math.min(endIndex, filteredRows.length)} of {filteredRows.length}
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">
                                    Article Preview
                                </p>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">
                                    {selectedArticle.title}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                                        {selectedArticle.type.toLowerCase() === "blog" ? "Blog post" : "News article"}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-[11px] font-medium text-gray-600">
                                        {selectedArticle.category}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-[11px] text-gray-500">
                                        {selectedArticle.createdAtLabel}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!editForm) {
                                            setEditForm({
                                                title: selectedArticle.title,
                                                category: selectedArticle.category,
                                                type: selectedArticle.type,
                                                content: selectedArticle.content,
                                                imageUrl: selectedArticle.imageUrl,
                                            });
                                        }
                                        setIsEditing((prev) => !prev);
                                    }}
                                    className="inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    aria-label={isEditing ? "Stop editing" : "Edit article"}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setIsEditing(false);
                                        setEditForm(null);
                                    }}
                                    className="inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    aria-label="Close"
                                >
                                    <span className="text-xl leading-none">&times;</span>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 sm:py-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Type
                                        </label>
                                        {isEditing && editForm ? (
                                            <select
                                                value={editForm.type}
                                                onChange={(e) =>
                                                    setEditForm((prev) =>
                                                        prev ? { ...prev, type: e.target.value } : prev
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none"
                                            >
                                                <option value="news">News</option>
                                                <option value="blog">Blog</option>
                                            </select>
                                        ) : (
                                            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-800">
                                                {selectedArticle.type.toLowerCase() === "blog" ? "Blog" : "News"}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category
                                        </label>
                                        {isEditing && editForm ? (
                                            <input
                                                type="text"
                                                value={editForm.category}
                                                onChange={(e) =>
                                                    setEditForm((prev) =>
                                                        prev ? { ...prev, category: e.target.value } : prev
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none"
                                            />
                                        ) : (
                                            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-800">
                                                {selectedArticle.category}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Published Date
                                        </label>
                                        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-800">
                                            {selectedArticle.createdAtLabel}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Image
                                        </label>
                                        {isEditing && editForm ? (
                                            <input
                                                type="url"
                                                value={editForm.imageUrl ?? ""}
                                                onChange={(e) =>
                                                    setEditForm((prev) =>
                                                        prev ? { ...prev, imageUrl: e.target.value } : prev
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none"
                                            />
                                        ) : (
                                            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden min-h-[160px]">
                                                {selectedArticle.imageUrl ? (
                                                    <img
                                                        src={selectedArticle.imageUrl}
                                                        alt={selectedArticle.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-gray-400 text-sm py-6">
                                                        <FileText className="w-6 h-6" />
                                                        <span>No image URL provided</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Title
                                        </label>
                                        {isEditing && editForm ? (
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) =>
                                                    setEditForm((prev) =>
                                                        prev ? { ...prev, title: e.target.value } : prev
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none"
                                            />
                                        ) : (
                                            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900">
                                                {selectedArticle.title}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Content
                                        </label>
                                        {isEditing && editForm ? (
                                            <textarea
                                                value={editForm.content}
                                                onChange={(e) =>
                                                    setEditForm((prev) =>
                                                        prev ? { ...prev, content: e.target.value } : prev
                                                    )
                                                }
                                                rows={8}
                                                className="w-full px-4 py-2 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:my-1 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white [&::-webkit-scrollbar-thumb]:hover:bg-gray-500"
                                            />
                                        ) : (
                                            <div
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-800 max-h-[260px] overflow-y-auto whitespace-pre-wrap leading-relaxed [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:my-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white [&::-webkit-scrollbar-thumb]:hover:bg-gray-400"
                                                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer actions when editing */}
                        {isEditing && (
                            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        if (selectedArticle) {
                                            setEditForm({
                                                title: selectedArticle.title,
                                                category: selectedArticle.category,
                                                type: selectedArticle.type,
                                                content: selectedArticle.content,
                                                imageUrl: selectedArticle.imageUrl,
                                            });
                                        } else {
                                            setEditForm(null);
                                        }
                                    }}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!editForm || !selectedArticle) return;
                                        // Update the selectedArticle locally so the preview reflects changes.
                                        setSelectedArticle({
                                            ...selectedArticle,
                                            title: editForm.title,
                                            category: editForm.category,
                                            type: editForm.type,
                                            content: editForm.content,
                                            imageUrl: editForm.imageUrl,
                                        });
                                        // TODO: call backend API to persist changes to the database.
                                        setIsEditing(false);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-[#ff4500] text-white text-sm font-medium hover:bg-[#e63e00] transition-colors"
                                >
                                    Save changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

