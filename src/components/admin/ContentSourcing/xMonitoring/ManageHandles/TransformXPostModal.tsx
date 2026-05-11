import React from 'react';
import {
    Zap,
    Loader2,
    X,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import CategorySelectWithOther from '@/components/admin/shared/CategorySelectWithOther';
import { LANGUAGE_OPTIONS } from '@/components/admin/generatedContent/CreateArticleModal/ManualGenerationTab';

import type { ArticleGenerationMode } from "@/lib/articleGenerationMode";

export type TweetArticleGenerationMode = ArticleGenerationMode;

interface TransformXPostModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerate: (
        prompt: string,
        categoryId: string,
        language: string,
        generationMode: TweetArticleGenerationMode
    ) => void;
    isPending: boolean;
    tweetText?: string;
    authorName?: string;
    tweetUrl?: string;
}

const GENERATION_PROMPT_MAX_LEN = 4000;

function XLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="currentColor"
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

export default function TransformXPostModal({
    open,
    onOpenChange,
    onGenerate,
    isPending,
    tweetText,
    authorName,
    tweetUrl
}: TransformXPostModalProps) {
    const [generationPrompt, setGenerationPrompt] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<string>('');
    const [language, setLanguage] = React.useState<string>('English');
    const [generationKind, setGenerationKind] = React.useState<"standalone" | "commentary">("standalone");
    const [fieldErrors, setFieldErrors] = React.useState<{ category?: string }>({});

    const resolvedGenerationMode: TweetArticleGenerationMode =
        generationKind === "standalone" ? "standalone" : "commentary";

    React.useEffect(() => {
        if (open) {
            setGenerationPrompt('');
            setSelectedCategory('');
            setLanguage('English');
            setGenerationKind("standalone");
            setFieldErrors({});
        }
    }, [open]);

    const handleCategoryChange = (val: string) => {
        setSelectedCategory(val);
        setFieldErrors(prev => ({ ...prev, category: undefined }));
    };

    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => articlesApi.getCategories(),
        enabled: open
    });

    const handleGenerate = () => {
        if (!selectedCategory) {
            setFieldErrors({ category: "Please select a category first" });
            return;
        }
        
        const finalPrompt = [
            generationPrompt?.trim(), 
            language ? `Write the entire article in ${language}.` : ""
        ].filter(Boolean).join("\n\n");

        onGenerate(finalPrompt, selectedCategory, language, resolvedGenerationMode);
    };

    // Extract Tweet ID for embed if possible
    const tweetId = tweetUrl?.split('/status/')?.[1]?.split('?')?.[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-6xl p-0 overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl">

                {/* ── Header ── */}
                <div className="relative bg-black px-8 py-8 overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,.6) 24px,rgba(255,255,255,.6) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,.6) 24px,rgba(255,255,255,.6) 25px)',
                        }}
                    />

                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-20"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="relative flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                            <XLogo className="w-7 h-7 text-black" />
                        </div>

                        <div className="space-y-1 text-white">
                            <DialogTitle className="text-2xl font-black tracking-tight">
                                Transform X Post
                            </DialogTitle>
                            <DialogDescription className="text-white/60 font-medium">
                                Turn this post into a full news article.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* ── Body Split ── */}
                <div className="flex flex-col lg:flex-row h-full min-h-[600px] max-h-[80vh]">
                    {/* Left Side: Form */}
                    <div className="flex-1 px-8 py-8 flex flex-col overflow-y-auto bg-white">
                        <div className="space-y-8 flex flex-col h-full">
                            {/* Row 1: Category & Language */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-shrink-0">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white font-black text-[10px]">01</span>
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-900">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                    </div>
                                    <CategorySelectWithOther
                                        value={selectedCategory}
                                        onValueChange={handleCategoryChange}
                                        categories={categories ?? []}
                                        isLoading={isLoadingCategories}
                                        placeholder="Select target category"
                                        triggerClassName={`w-full h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 shadow-sm transition-all ${fieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-200"
                                            }`}
                                        error={fieldErrors.category}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white font-black text-[10px]">02</span>
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-900">Output Language</label>
                                    </div>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 border-gray-200 text-sm font-bold text-gray-900 shadow-sm">
                                            <SelectValue placeholder="Select Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGE_OPTIONS.map((lang) => (
                                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Row 2: Generation Mode */}
                            <div className="space-y-3 flex-shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white font-black text-[10px]">03</span>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-900">Generation Mode</label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setGenerationKind("standalone")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setGenerationKind("standalone");
                                            }
                                        }}
                                        className={`cursor-pointer text-left rounded-xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-gray-800 ${generationKind === "standalone"
                                                ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                                                : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${generationKind === "standalone" ? "bg-white" : "bg-gray-400"}`} />
                                            <p className="text-xs font-black uppercase tracking-wide">Independent Report</p>
                                        </div>
                                        <p className={`text-xs font-medium leading-snug ${generationKind === "standalone" ? "text-white/70" : "text-gray-500"}`}>
                                            Full news article using the post as a primary source.
                                        </p>
                                    </div>

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setGenerationKind("commentary")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setGenerationKind("commentary");
                                            }
                                        }}
                                        className={`cursor-pointer text-left rounded-xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-gray-800 ${generationKind === "commentary"
                                                ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                                                : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${generationKind === "commentary" ? "bg-white" : "bg-gray-400"}`} />
                                            <p className="text-xs font-black uppercase tracking-wide">Social Commentary</p>
                                        </div>
                                        <p className={`text-xs font-medium leading-snug ${generationKind === "commentary" ? "text-white/70" : "text-gray-500"}`}>
                                            Includes an embedded reproduction of the post.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Custom Prompt - Flexing to fill space */}
                            <div className="space-y-3 flex-1 flex flex-col min-h-[200px]">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white font-black text-[10px]">04</span>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-900">
                                        Custom Prompt{' '}
                                        <span className="text-gray-400 font-bold normal-case tracking-normal">
                                            {generationKind === "commentary" ? "(Recommended)" : "(Optional)"}
                                        </span>
                                    </label>
                                </div>
                                <div className="flex-1 flex flex-col relative group">
                                    <Textarea
                                        value={generationPrompt}
                                        onChange={(e) => setGenerationPrompt(e.target.value.slice(0, GENERATION_PROMPT_MAX_LEN))}
                                        placeholder={
                                            generationKind === "commentary"
                                                ? "e.g. Take a supportive angle; criticize the response; emphasize economic impact…"
                                                : "e.g. Focus on political implications, write for a tech-savvy audience…"
                                        }
                                        className="flex-1 w-full rounded-xl bg-gray-50 border-gray-200 p-4 text-sm font-medium focus:ring-gray-900/20 resize-none transition-all"
                                        disabled={isPending}
                                    />
                                    <p className="absolute bottom-3 right-4 text-[10px] font-bold text-gray-400 bg-gray-50/80 px-2 py-0.5 rounded-full border border-gray-200/50">
                                        {generationPrompt.length} / {GENERATION_PROMPT_MAX_LEN}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Embed Preview */}
                    <div className="w-full lg:w-[450px] bg-gray-50 border-l border-gray-100 p-8 flex flex-col items-center overflow-y-auto">
                        <div className="w-full space-y-4">
                            <div className="flex items-center gap-2">
                                <XLogo className="w-4 h-4 text-gray-400" />
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Post Preview</h4>
                            </div>

                            <div className="w-full min-h-[400px] rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center relative">
                                {tweetId ? (
                                    <iframe
                                        key={tweetId}
                                        src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light`}
                                        className="w-full h-full border-none min-h-[500px]"
                                        title="Tweet Embed"
                                    />
                                ) : (
                                    <div className="p-6 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                                            <XLogo className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-400 italic">Preview not available</p>
                                    </div>
                                )}
                            </div>

                            {tweetUrl && (
                                <a
                                    href={tweetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-center text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest mt-4"
                                >
                                    Open Original Post
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <DialogFooter className="px-8 py-5 bg-white border-t border-gray-100 flex flex-row items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl font-bold text-gray-500 px-6 h-11 hover:bg-gray-100"
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isPending || !selectedCategory}
                        className="h-11 px-8 rounded-xl bg-black hover:bg-gray-900 text-white font-black text-sm shadow-xl shadow-black/20 active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating…</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 fill-white" />
                                <span>Generate Article</span>
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
