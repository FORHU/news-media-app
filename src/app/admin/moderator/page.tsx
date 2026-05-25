"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, CheckCircle2, ArrowRight, RotateCcw, Globe, Upload, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PageState = "form" | "generating" | "preview" | "published";

interface SiteArticle {
    domain: string;
    language: string;
    flag: string;
    id: string;
    title: string;
    content: string;
    imageUrl: string | null;
}

const GENERATING_SITES = [
    { flag: "🇺🇸", short: "EN", domain: "jejutime.com" },
    { flag: "🇰🇷", short: "KO", domain: "voicejeju.com" },
    { flag: "🇨🇳", short: "ZH", domain: "jejuqq.com" },
    { flag: "🇯🇵", short: "JA", domain: "jejujapan.com" },
];

function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function ModeratorPage() {
    const [pageState, setPageState] = useState<PageState>("form");
    const [siteArticles, setSiteArticles] = useState<SiteArticle[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [catOpen, setCatOpen] = useState(false);
    const catRef = useRef<HTMLDivElement>(null);
    const [fieldErrors, setFieldErrors] = useState<{ title?: string; topic?: string; category?: string }>({});

    useEffect(() => {
        fetch("/api/admin/moderator/categories", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (catRef.current && !catRef.current.contains(e.target as Node)) {
                setCatOpen(false);
            }
        }
        if (catOpen) document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [catOpen]);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.[0]) setImageFile(e.target.files[0]);
    }

    function removeImage() { setImageFile(null); }

    async function handleGenerate(e: React.SyntheticEvent) {
        e.preventDefault();
        const errors: typeof fieldErrors = {};
        if (!selectedCategory) errors.category = "Please select a category.";
        if (!title.trim()) errors.title = "Title is required.";
        if (!topic.trim()) errors.topic = "Article content is required.";
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setGenerateError(null);
        setPageState("generating");

        try {
            const s3ImageUrl = imageFile ? await readFileAsBase64(imageFile) : "";
            const res = await fetch("/api/admin/moderator/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content: topic, categoryName, s3ImageUrl }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Generation failed.");
            }
            const { articles } = await res.json();
            setSiteArticles(articles);
            setActiveTab(0);
            setPageState("preview");
        } catch (err: any) {
            setGenerateError(err.message || "Something went wrong. Please try again.");
            setPageState("form");
        }
    }

    async function handlePublishAll() {
        setIsPublishing(true);
        setPublishError(null);
        try {
            const res = await fetch("/api/admin/moderator/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleIds: siteArticles.map((a) => a.id) }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Publish failed.");
            }
            setPageState("published");
        } catch (err: any) {
            setPublishError(err.message || "Publish failed. Please try again.");
        } finally {
            setIsPublishing(false);
        }
    }

    function handleStartOver() {
        setTitle(""); setTopic(""); setImageFile(null);
        setSelectedCategory(""); setCategoryName("");
        setFieldErrors({}); setSiteArticles([]);
        setPublishError(null); setGenerateError(null);
        setPageState("form");
    }

    // ── Published ─────────────────────────────────────────────────────────────
    if (pageState === "published") {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center gap-8 text-center px-4 py-16">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 14 }}
                    className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-500/10 border-2 border-green-100 dark:border-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100">Published Successfully</h2>
                    <p className="text-sm text-gray-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                        Your article is now live across all 4 sites in English, Korean, Chinese, and Japanese.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    {GENERATING_SITES.map(({ flag, domain }, i) => (
                        <motion.div key={domain} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.07 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-xs font-medium text-gray-500 dark:text-zinc-400">
                            <span>{flag}</span><span>{domain}</span>
                        </motion.div>
                    ))}
                </div>
                <Button onClick={handleStartOver}
                    className="h-12 px-8 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-orange-200/50 gap-2">
                    <ArrowRight className="w-4 h-4" />Create Another Article
                </Button>
            </motion.div>
        );
    }

    // ── Generating ────────────────────────────────────────────────────────────
    if (pageState === "generating") {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center gap-10 text-center px-4 py-16">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-orange-100 dark:bg-orange-500/20 animate-ping opacity-30" />
                    <div className="relative w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-500/10 border-2 border-orange-100 dark:border-orange-500/20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100">Translating Article</h2>
                    <p className="text-sm text-gray-400 dark:text-zinc-500">Creating versions for all 4 sites. This may take a moment.</p>
                </div>
                <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
                    {GENERATING_SITES.map(({ flag, short, domain }, i) => (
                        <motion.div key={domain} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm">
                            <span className="text-2xl">{flag}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">{short}</span>
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
                                className="w-8 h-1 rounded-full bg-orange-300 dark:bg-orange-500/50" />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    }

    // ── Preview ───────────────────────────────────────────────────────────────
    if (pageState === "preview" && siteArticles.length > 0) {
        const active = siteArticles[activeTab];
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 h-full">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100">Review & Publish</h1>
                        <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">Preview each version before publishing to all 4 sites.</p>
                    </div>
                    <button onClick={handleStartOver}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors mt-1">
                        <RotateCcw className="w-3.5 h-3.5" />Start Over
                    </button>
                </div>

                {/* Two-column: tabs left, article right */}
                <div className="flex gap-5 flex-1 min-h-0">
                    {/* Site tabs — vertical column */}
                    <div className="flex flex-col gap-2 w-44 shrink-0">
                        {siteArticles.map((a, i) => (
                            <button key={a.domain} onClick={() => setActiveTab(i)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                                    activeTab === i
                                        ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200/50"
                                        : "bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-orange-200 dark:hover:border-orange-500/30 hover:bg-orange-50/40 dark:hover:bg-orange-500/5"
                                }`}>
                                <span className="text-2xl leading-none">{a.flag}</span>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest leading-none">{a.language}</p>
                                    <p className={`text-[9px] font-medium truncate mt-0.5 ${activeTab === i ? "text-orange-100" : "text-gray-400 dark:text-zinc-600"}`}>
                                        {a.domain}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Article preview — scrollable */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
                                className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex-1">
                                {active.imageUrl && (
                                    <div className="w-full h-56 overflow-hidden">
                                        <img src={active.imageUrl} alt={active.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-7 space-y-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-3 py-1 rounded-full">
                                            {active.flag} {active.domain}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">{active.language}</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 leading-snug">{active.title}</h2>
                                    <div className="h-px bg-gray-100 dark:bg-zinc-700" />
                                    <div className="text-[14px] text-gray-600 dark:text-zinc-300 leading-7 whitespace-pre-line">{active.content}</div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {publishError && (
                            <p className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-2.5 rounded-xl shrink-0">
                                {publishError}
                            </p>
                        )}

                        <div className="flex items-center justify-between shrink-0 pb-2">
                            <Button variant="outline" onClick={handleStartOver}
                                className="h-11 px-5 rounded-2xl font-black uppercase tracking-widest text-xs border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 dark:bg-transparent dark:hover:bg-zinc-800">
                                Discard
                            </Button>
                            <Button onClick={handlePublishAll} disabled={isPublishing}
                                className="h-11 px-7 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-200/50 disabled:opacity-60 gap-2">
                                {isPublishing
                                    ? <><Loader2 className="w-4 h-4 animate-spin" />Publishing…</>
                                    : <>Publish to All 4 Sites<ArrowRight className="w-3.5 h-3.5" /></>}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────────────────
    const wordCount = topic.trim() ? topic.trim().split(/\s+/).length : 0;

    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-4">
            <form onSubmit={handleGenerate} className="flex-1 flex flex-col gap-4">
                {/* Page header */}
                <div className="shrink-0">
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100">Create Article</h1>
                    <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">Write in English — automatically translated for all 4 sites.</p>
                </div>

                {generateError && (
                    <div className="shrink-0 flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                        <div className="shrink-0 w-1 self-stretch rounded-full bg-red-400 min-h-[20px]" />
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">{generateError}</p>
                    </div>
                )}

                {/* Translation strip */}
                <div className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
                    <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="flex items-center gap-3 flex-1">
                        {["🇺🇸 EN", "🇰🇷 KO", "🇨🇳 ZH", "🇯🇵 JA"].map((l) => (
                            <span key={l} className="text-[11px] font-black uppercase tracking-widest text-sky-500 dark:text-sky-400">{l}</span>
                        ))}
                    </div>
                    <span className="text-[11px] font-medium text-sky-400 dark:text-sky-500 shrink-0">Auto-translated</span>
                </div>

                {/* Two-column grid — fills remaining height */}
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 gap-4 flex-1 min-h-0">

                    {/* Left column */}
                    <div className="flex flex-col gap-4">

                        {/* 01 Category */}
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700">
                                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-black shrink-0">01</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Category</span>
                            </div>
                            <div className="px-6 py-5 space-y-2">
                                <select value={selectedCategory}
                                    onChange={(e) => {
                                        const sel = categories.find((c) => c.id === e.target.value);
                                        setSelectedCategory(e.target.value);
                                        setCategoryName(sel?.name ?? "");
                                        setFieldErrors((p) => ({ ...p, category: undefined }));
                                    }}
                                    className={`w-full h-11 rounded-xl bg-gray-50 dark:bg-zinc-900 border px-4 text-sm font-medium text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400/20 cursor-pointer transition-colors appearance-none ${
                                        fieldErrors.category ? "border-red-300" : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                                    }`}>
                                    <option value="">Select a category…</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {fieldErrors.category && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{fieldErrors.category}</p>}
                            </div>
                        </div>

                        {/* 02 Title */}
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700">
                                <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0">02</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Title</span>
                            </div>
                            <div className="px-6 py-5 space-y-2">
                                <Input placeholder="Enter the article title in English…" value={title}
                                    onChange={(e) => { setTitle(e.target.value); setFieldErrors((p) => ({ ...p, title: undefined })); }}
                                    className={`h-12 rounded-xl bg-gray-50 dark:bg-zinc-900 dark:text-zinc-100 text-base font-medium border focus-visible:ring-orange-400/20 transition-colors ${
                                        fieldErrors.title ? "border-red-300" : "border-gray-200 dark:border-zinc-700"
                                    }`} />
                                {fieldErrors.title && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{fieldErrors.title}</p>}
                            </div>
                        </div>

                        {/* 03 Featured Image */}
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700">
                                <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0">03</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Featured Image</span>
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium ml-1">Optional</span>
                            </div>
                            <div className="px-6 py-5">
                                <div
                                    className="relative group border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl transition-all hover:border-orange-300 dark:hover:border-orange-500/40 hover:bg-orange-50/30 dark:hover:bg-orange-500/5 flex items-center justify-center cursor-pointer overflow-hidden min-h-[220px]"
                                    onClick={() => !imageFile && document.getElementById("image-upload")?.click()}>
                                    <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    {imageFile ? (
                                        <div className="absolute inset-0 w-full h-full">
                                            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                                                <Button type="button" size="sm"
                                                    className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/40 text-xs font-bold h-8 px-4"
                                                    onClick={(e) => { e.stopPropagation(); document.getElementById("image-upload")?.click(); }}>Change</Button>
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
                            </div>
                        </div>
                    </div>

                    {/* Right column — Article Content (fills height) */}
                    <div className="flex flex-col gap-4 min-h-0">
                        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col flex-1">
                            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-50 dark:border-zinc-700 shrink-0">
                                <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0">04</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300">Article Content</span>
                            </div>
                            <div className="px-6 py-5 flex flex-col flex-1 gap-2">
                                <Textarea
                                    placeholder="Write the full article in English. It will be automatically translated into Korean, Chinese, and Japanese."
                                    value={topic}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setTopic(e.target.value); setFieldErrors((p) => ({ ...p, topic: undefined })); }}
                                    className={`flex-1 min-h-[320px] rounded-xl bg-gray-50 dark:bg-zinc-900 dark:text-zinc-100 resize-none text-sm font-medium border focus-visible:ring-orange-400/20 transition-colors leading-relaxed ${
                                        fieldErrors.topic ? "border-red-300" : "border-gray-200 dark:border-zinc-700"
                                    }`}
                                />
                                <div className="flex items-center justify-between">
                                    {fieldErrors.topic
                                        ? <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{fieldErrors.topic}</p>
                                        : <span />}
                                    {wordCount > 0 && <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">{wordCount} word{wordCount !== 1 ? "s" : ""}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="shrink-0 flex justify-end pb-2">
                            <Button type="submit"
                                className="h-12 px-8 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-orange-200/50 gap-2">
                                Generate Article<ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </motion.div>
    );
}
