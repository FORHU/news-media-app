"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, ChevronLeft, ChevronRight, Plus, FileText, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Article {
    id: string;
    title: string;
    slug: string | null;
    status: string;
    imageUrl: string | null;
    publishDate: string | null;
    createdAt: string;
    tenantId: string;
    tenant: { domain: string } | null;
    category: { id: string; categoryName: string };
    user: { firstName: string; lastName: string };
}

interface ArticleGroup {
    primary: Article;
    siblings: Article[];
}

const DOMAIN_ORDER = ["jejutime.com", "voicejeju.com", "jejuqq.com", "jejujapan.com"];

const DOMAIN_INFO: Record<string, { lang: string; color: string }> = {
    "jejutime.com":  { lang: "EN", color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" },
    "voicejeju.com": { lang: "KO", color: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" },
    "jejuqq.com":    { lang: "ZH", color: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" },
    "jejujapan.com": { lang: "JA", color: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400" },
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ModeratorArticlesPage() {
    const [groups, setGroups] = useState<ArticleGroup[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    const [unpublishingKey, setUnpublishingKey] = useState<string | null>(null);
    const [publishingKey, setPublishingKey] = useState<string | null>(null);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/moderator/articles?page=${page}`, { cache: "no-store" });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setGroups(data.groups ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
        } catch {
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    // Standard fetch-on-dependency-change pattern; fetchArticles sets loading
    // state synchronously before its first await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { fetchArticles(); }, [fetchArticles]);

    async function handleRepublish(groupKey: string, allIds: string[]) {
        setPublishingKey(groupKey);
        try {
            const res = await fetch("/api/admin/moderator/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleIds: allIds }),
            });
            if (!res.ok) throw new Error("Failed to publish.");
            fetchArticles();
        } catch (e: unknown) {
            setDeleteError(e instanceof Error ? e.message : "Publish failed.");
        } finally {
            setPublishingKey(null);
        }
    }

    async function handleUnpublish(groupKey: string, allIds: string[]) {
        setUnpublishingKey(groupKey);
        try {
            const res = await fetch("/api/admin/moderator/unpublish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleIds: allIds }),
            });
            if (!res.ok) throw new Error("Failed to unpublish.");
            fetchArticles();
        } catch (e: unknown) {
            setDeleteError(e instanceof Error ? e.message : "Unpublish failed.");
        } finally {
            setUnpublishingKey(null);
        }
    }

    async function handleDelete(id: string) {
        setDeletingId(id);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/admin/moderator/articles/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete.");
            setConfirmDeleteId(null);
            fetchArticles();
        } catch (e: unknown) {
            setDeleteError(e instanceof Error ? e.message : "Delete failed.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100">My Articles</h1>
                    <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">Published articles across all 4 sites.</p>
                </div>
                <Link href="/admin/moderator">
                    <Button className="h-10 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-md shadow-orange-200/50 gap-2">
                        <Plus className="w-3.5 h-3.5" />New Article
                    </Button>
                </Link>
            </div>

            {deleteError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />{deleteError}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">No articles yet</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">Create and publish your first article to get started.</p>
                    </div>
                    <Link href="/admin/moderator">
                        <Button className="h-10 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs gap-2">
                            <Plus className="w-3.5 h-3.5" />Create Article
                        </Button>
                    </Link>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {groups.map(({ primary, siblings }) => {
                        const groupKey = primary.id;
                        const isExpanded = expandedKey === groupKey;
                        const allIds = [primary.id, ...siblings.map((s) => s.id)];
                        const info = DOMAIN_INFO["jejutime.com"];
                        const sortedSiblings = [...siblings].sort(
                            (a, b) =>
                                DOMAIN_ORDER.indexOf(a.tenant?.domain ?? "") -
                                DOMAIN_ORDER.indexOf(b.tenant?.domain ?? "")
                        );

                        return (
                            <motion.div key={groupKey} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">

                                {/* Primary row — English (jejutime.com) */}
                                <div
                                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-zinc-700/40 transition-colors"
                                    onClick={() => siblings.length > 0 && setExpandedKey(isExpanded ? null : groupKey)}>

                                    {/* Thumbnail */}
                                    <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-700 relative">
                                        {primary.imageUrl
                                            ? <Image src={primary.imageUrl} alt={primary.title} fill sizes="48px" className="object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center"><FileText className="w-4 h-4 text-gray-300 dark:text-zinc-500" /></div>}
                                    </div>

                                    {/* Title + meta */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate leading-snug">{primary.title}</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${info.color}`}>{info.lang}</span>
                                            {primary.status === "published" ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500" />Unpublished
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-2 py-0.5 rounded-full">
                                                {primary.category.categoryName}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                                                {primary.publishDate ? formatDate(primary.publishDate) : formatDate(primary.createdAt)}
                                            </span>
                                            {siblings.length > 0 && (
                                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                                                    +{siblings.length} translation{siblings.length !== 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        {confirmDeleteId === primary.id ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Delete?</span>
                                                <button onClick={() => handleDelete(primary.id)} disabled={deletingId === primary.id}
                                                    className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">
                                                    {deletingId === primary.id ? "…" : "Yes"}
                                                </button>
                                                <button onClick={() => setConfirmDeleteId(null)}
                                                    className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-colors">
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {primary.status === "published" ? (
                                                    <button
                                                        onClick={() => handleUnpublish(groupKey, allIds)}
                                                        disabled={unpublishingKey === groupKey}
                                                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20">
                                                        {unpublishingKey === groupKey ? "…" : "Unpublish"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRepublish(groupKey, allIds)}
                                                        disabled={publishingKey === groupKey}
                                                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20">
                                                        {publishingKey === groupKey ? "…" : "Publish"}
                                                    </button>
                                                )}
                                                <Link href={`/admin/moderator/articles/${primary.id}/edit`}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Link>
                                                <button onClick={() => { setConfirmDeleteId(primary.id); setDeleteError(null); }}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Expand chevron */}
                                    {siblings.length > 0 && (
                                        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                    )}
                                </div>

                                {/* Sibling rows (dropdown) — voicejeju, jejuqq, jejujapan */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && sortedSiblings.length > 0 && (
                                        <motion.div
                                            key="siblings"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden">
                                            {sortedSiblings.map((article, idx) => {
                                                const tInfo = DOMAIN_INFO[article.tenant?.domain ?? ""] ?? { lang: "??", color: "bg-gray-100 text-gray-500" };
                                                return (
                                                    <div key={article.id}
                                                        className={`flex items-center gap-3 pl-5 pr-5 py-3 bg-gray-50/50 dark:bg-zinc-900/30 ${idx < sortedSiblings.length - 1 ? "border-b border-gray-100 dark:border-zinc-700/50" : ""}`}>

                                                        <div className="shrink-0 w-12" />

                                                        <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${tInfo.color}`}>
                                                            {tInfo.lang}
                                                        </span>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-0.5">{article.tenant?.domain}</p>
                                                            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 truncate">{article.title}</p>
                                                        </div>

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

                                                        <div className="w-4 shrink-0" />
                                                    </div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
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
