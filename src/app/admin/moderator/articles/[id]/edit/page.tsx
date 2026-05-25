"use client";

import React, { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, X, Upload, Loader2, CheckCircle2, AlertCircle, Globe } from "lucide-react";
import Link from "next/link";

interface Category { id: string; name: string; }
interface Article {
    id: string;
    title: string;
    content: string;
    status: string;
    imageUrl: string | null;
    categoryId: string;
    tenantId: string;
    category: { id: string; categoryName: string };
    createdAt: string;
    publishDate: string | null;
}

type ImageState =
    | { type: "unchanged" }
    | { type: "removed" }
    | { type: "new"; file: File; preview: string };

function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [article, setArticle] = useState<Article | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [status, setStatus] = useState("pending");
    const [imageState, setImageState] = useState<ImageState>({ type: "unchanged" });

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ title?: string; content?: string; category?: string }>({});

    useEffect(() => {
        fetch(`/api/admin/moderator/articles/${id}`, { cache: "no-store" })
            .then(async (articleRes) => {
                if (!articleRes.ok) throw new Error("Article not found.");
                const data = await articleRes.json();
                setArticle(data);
                setTitle(data.title || "");
                setContent(data.content || "");
                setStatus(data.status || "pending");
                setCategoryId(data.categoryId || "");

                // Fetch categories scoped to this article's tenant so translated names
                // resolve to their English display label but store the correct tenant category ID
                const catsRes = await fetch(
                    `/api/admin/moderator/categories?tenantId=${data.tenantId}`,
                    { cache: "no-store" }
                );
                const catsData = await catsRes.json();
                setCategories(Array.isArray(catsData) ? catsData : []);
            })
            .catch((e) => setLoadError(e.message || "Failed to load article."));
    }, [id]);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageState({ type: "new", file, preview: URL.createObjectURL(file) });
    }

    function removeImage() { setImageState({ type: "removed" }); }
    function resetImage() { setImageState({ type: "unchanged" }); }

    async function handleSave(e: React.SyntheticEvent) {
        e.preventDefault();
        const errors: typeof fieldErrors = {};
        if (!title.trim()) errors.title = "Title is required.";
        if (!content.trim()) errors.content = "Content is required.";
        if (!categoryId) errors.category = "Please select a category.";
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const body: Record<string, unknown> = { title, content, categoryId, status };
            if (imageState.type === "removed") body.imageUrl = null;
            else if (imageState.type === "new") body.imageUrl = await readFileAsBase64(imageState.file);

            const res = await fetch(`/api/admin/moderator/articles/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Save failed.");
            }
            const updated = await res.json();
            setArticle((prev) => prev ? { ...prev, ...updated } : prev);
            setImageState({ type: "unchanged" });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setSaveError(err.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-14 h-14 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">{loadError}</p>
                <Link href="/admin/moderator/articles">
                    <Button variant="outline" className="rounded-2xl font-black uppercase tracking-widest text-xs dark:border-zinc-700 dark:text-zinc-300 dark:bg-transparent">
                        Back to Articles
                    </Button>
                </Link>
            </div>
        );
    }

    // ── Skeleton ──────────────────────────────────────────────────────────────
    if (!article) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-3xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
                ))}
            </div>
        );
    }

    const currentImageUrl = imageState.type === "new" ? imageState.preview
        : imageState.type === "removed" ? null
        : article.imageUrl;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    // ── Form ──────────────────────────────────────────────────────────────────
    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-4">
            <form onSubmit={handleSave} className="flex-1 flex flex-col gap-4">

                {/* Header */}
                <div className="shrink-0 flex items-start gap-4 pb-1">
                    <Link href="/admin/moderator/articles"
                        className="mt-1 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-0.5">Editing Article</p>
                        <h1 className="text-lg font-black text-gray-900 dark:text-zinc-100 leading-snug line-clamp-1">{article.title}</h1>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mt-0.5">Created {formatDate(article.createdAt)}</p>
                    </div>
                </div>

                {/* Alerts */}
                {saveError && (
                    <div className="shrink-0 flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                        <div className="w-1 self-stretch rounded-full bg-red-400 min-h-[20px] shrink-0" />
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">{saveError}</p>
                    </div>
                )}
                {saveSuccess && (
                    <div className="shrink-0 flex items-center gap-2 p-4 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Changes saved successfully.</p>
                    </div>
                )}

                {/* Translation note */}
                <div className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
                    <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                    <p className="text-xs font-medium text-sky-500 dark:text-sky-400">
                        This is one language version. Each site stores its own translated copy.
                    </p>
                </div>

                {/* Two-column grid — fills remaining height */}
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 gap-4 flex-1 min-h-0">

                    {/* Left column */}
                    <div className="flex flex-col gap-4">

                        {/* 01 Status */}
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700">
                                <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-black shrink-0">01</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Status</span>
                            </div>
                            <div className="px-6 py-5">
                                {status === "published" ? (
                                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-green-500 text-white text-xs font-black uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                        Published
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-xs font-black uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500" />
                                        Unpublished
                                    </div>
                                )}
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium mt-3">
                                    {status === "published" ? "This article is visible on the site." : "This article is not publicly visible."}
                                </p>
                            </div>
                        </div>

                        {/* 02 Category */}
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700">
                                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-black shrink-0">02</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Category</span>
                            </div>
                            <div className="px-6 py-5 space-y-2">
                                <select value={categoryId}
                                    onChange={(e) => { setCategoryId(e.target.value); setFieldErrors((p) => ({ ...p, category: undefined })); }}
                                    className={`w-full h-11 rounded-xl bg-gray-50 dark:bg-zinc-900 border px-4 text-sm font-medium text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400/20 cursor-pointer transition-colors appearance-none ${
                                        fieldErrors.category ? "border-red-300" : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                                    }`}>
                                    <option value="">Select a category…</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {fieldErrors.category && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{fieldErrors.category}</p>}
                            </div>
                        </div>

                        {/* 03 Title */}
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700">
                                <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0">03</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Title</span>
                            </div>
                            <div className="px-6 py-5 space-y-2">
                                <Input value={title}
                                    onChange={(e) => { setTitle(e.target.value); setFieldErrors((p) => ({ ...p, title: undefined })); }}
                                    className={`h-12 rounded-xl bg-gray-50 dark:bg-zinc-900 dark:text-zinc-100 text-base font-medium border focus-visible:ring-orange-400/20 transition-colors ${
                                        fieldErrors.title ? "border-red-300" : "border-gray-200 dark:border-zinc-700"
                                    }`} />
                                {fieldErrors.title && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{fieldErrors.title}</p>}
                            </div>
                        </div>

                        {/* 04 Featured Image */}
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700">
                                <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0">04</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Featured Image</span>
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium ml-1">Optional</span>
                            </div>
                            <div className="px-6 py-5">
                                <div
                                    className="relative group border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl transition-all hover:border-orange-300 dark:hover:border-orange-500/40 hover:bg-orange-50/30 dark:hover:bg-orange-500/5 flex items-center justify-center cursor-pointer overflow-hidden min-h-[220px]"
                                    onClick={() => !currentImageUrl && document.getElementById("img-upload")?.click()}>
                                    <input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    {currentImageUrl ? (
                                        <div className="absolute inset-0 w-full h-full">
                                            <img src={currentImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                                                <Button type="button" size="sm"
                                                    className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/40 text-xs font-bold h-8 px-4"
                                                    onClick={(e) => { e.stopPropagation(); document.getElementById("img-upload")?.click(); }}>Change</Button>
                                                <Button type="button" variant="destructive" size="sm" className="rounded-full text-xs font-bold h-8 px-3"
                                                    onClick={(e) => { e.stopPropagation(); removeImage(); }}>
                                                    <X className="w-3.5 h-3.5 mr-1" />Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 py-8">
                                            <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-zinc-700 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 flex items-center justify-center transition-colors">
                                                <Upload className="w-5 h-5 text-gray-400 dark:text-zinc-500 group-hover:text-orange-500 transition-colors" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Click to upload</p>
                                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">PNG, JPG, WebP</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {imageState.type === "removed" && article.imageUrl && (
                                    <div className="flex items-center justify-between mt-2 px-1">
                                        <p className="text-xs text-gray-400 dark:text-zinc-500">Original image will be removed on save.</p>
                                        <button type="button" onClick={resetImage} className="text-xs font-bold text-orange-500 hover:text-orange-600">Undo</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right column — Content (fills height) + Actions */}
                    <div className="flex flex-col gap-4 min-h-0">
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col flex-1">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700 shrink-0">
                                <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0">05</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Article Content</span>
                            </div>
                            <div className="px-6 py-5 flex flex-col flex-1 gap-2">
                                <Textarea value={content}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setContent(e.target.value); setFieldErrors((p) => ({ ...p, content: undefined })); }}
                                    className={`flex-1 min-h-[320px] rounded-xl bg-gray-50 dark:bg-zinc-900 dark:text-zinc-100 resize-none text-sm font-medium border focus-visible:ring-orange-400/20 transition-colors leading-relaxed ${
                                        fieldErrors.content ? "border-red-300" : "border-gray-200 dark:border-zinc-700"
                                    }`} />
                                <div className="flex items-center justify-between">
                                    {fieldErrors.content
                                        ? <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{fieldErrors.content}</p>
                                        : <span />}
                                    {wordCount > 0 && <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">{wordCount} word{wordCount !== 1 ? "s" : ""}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center justify-between pb-2">
                            <Link href="/admin/moderator/articles">
                                <Button type="button" variant="outline"
                                    className="h-11 px-5 rounded-2xl font-black uppercase tracking-widest text-xs border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 dark:bg-transparent dark:hover:bg-zinc-800">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={saving}
                                className="h-11 px-8 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-200/50 disabled:opacity-60 gap-2">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                                    : saveSuccess ? <><CheckCircle2 className="w-4 h-4" />Saved</>
                                    : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </motion.div>
    );
}
