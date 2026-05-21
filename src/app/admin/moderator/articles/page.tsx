"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, ChevronLeft, ChevronRight, Plus, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Article {
    id: string;
    title: string;
    slug: string | null;
    status: string;
    imageUrl: string | null;
    publishDate: string | null;
    createdAt: string;
    category: { id: string; categoryName: string };
    user: { firstName: string; lastName: string };
}

type StatusFilter = "all" | "published";

function StatusBadge({ status }: { status: string }) {
    const isPublished = status === "published";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
            isPublished
                ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20"
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-green-500 dark:bg-green-400" : "bg-amber-400"}`} />
            {isPublished ? "Published" : "Pending"}
        </span>
    );
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ModeratorArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [counts, setCounts] = useState({ pending: 0, published: 0 });
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (filter !== "all") params.set("status", filter);
            const res = await fetch(`/api/admin/moderator/articles?${params}`, { cache: "no-store" });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setArticles(data.articles);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setCounts(data.counts);
        } catch {
            setArticles([]);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { fetchArticles(); }, [fetchArticles]);

    async function handleDelete(id: string) {
        setDeletingId(id);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/admin/moderator/articles/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete.");
            setConfirmDeleteId(null);
            fetchArticles();
        } catch (e: any) {
            setDeleteError(e.message || "Delete failed.");
        } finally {
            setDeletingId(null);
        }
    }

    const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
        { key: "all", label: "All", count: counts.pending + counts.published },
        { key: "published", label: "Published", count: counts.published },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100">My Articles</h1>
                    <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">Articles you have created and translated.</p>
                </div>
                <Link href="/admin/moderator">
                    <Button className="h-10 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-md shadow-orange-200/50 gap-2">
                        <Plus className="w-3.5 h-3.5" />New Article
                    </Button>
                </Link>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1 w-fit">
                {filterTabs.map(({ key, label, count }) => (
                    <button key={key} onClick={() => { setFilter(key); setPage(1); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            filter === key
                                ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm"
                                : "text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                        }`}>
                        {label}
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            filter === key
                                ? "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                                : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                        }`}>{count}</span>
                    </button>
                ))}
            </div>

            {deleteError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />{deleteError}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                </div>
            ) : articles.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            {filter === "all" ? "No articles yet" : `No ${filter} articles`}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
                            {filter === "all" ? "Create your first article to get started." : "Try a different filter."}
                        </p>
                    </div>
                    {filter === "all" && (
                        <Link href="/admin/moderator">
                            <Button className="h-10 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs gap-2">
                                <Plus className="w-3.5 h-3.5" />Create Article
                            </Button>
                        </Link>
                    )}
                </motion.div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={`${filter}-${page}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                        {/* Table header */}
                        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-900/60">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Article</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Category</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Status</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Actions</span>
                        </div>
                        {articles.map((article, i) => (
                            <div key={article.id}
                                className={`flex md:grid md:grid-cols-[3fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-zinc-700/50 ${
                                    i < articles.length - 1 ? "border-b border-gray-50 dark:border-zinc-700" : ""
                                }`}>
                                {/* Col 1: Thumbnail + Info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-700">
                                        {article.imageUrl
                                            ? <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center"><FileText className="w-4 h-4 text-gray-300 dark:text-zinc-500" /></div>}
                                    </div>
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate leading-snug">{article.title}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">{formatDate(article.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Col 2: Category */}
                                <div className="hidden md:flex items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-2.5 py-1 rounded-full">
                                        {article.category.categoryName}
                                    </span>
                                </div>

                                {/* Col 3: Status */}
                                <div className="hidden md:flex items-center">
                                    <StatusBadge status={article.status} />
                                </div>

                                {/* Actions */}
                                <div className="shrink-0 flex items-center gap-1">
                                    {confirmDeleteId === article.id ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Delete?</span>
                                            <button onClick={() => handleDelete(article.id)} disabled={deletingId === article.id}
                                                className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">
                                                {deletingId === article.id ? "…" : "Yes"}
                                            </button>
                                            <button onClick={() => setConfirmDeleteId(null)}
                                                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-colors">
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Link href={`/admin/moderator/articles/${article.id}/edit`}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Link>
                                            <button onClick={() => { setConfirmDeleteId(article.id); setDeleteError(null); }}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">{total} article{total !== 1 ? "s" : ""} total</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-black text-gray-500 dark:text-zinc-400 min-w-[60px] text-center">{page} / {totalPages}</span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
