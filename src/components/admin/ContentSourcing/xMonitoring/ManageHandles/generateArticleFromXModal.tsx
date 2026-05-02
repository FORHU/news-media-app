import React from 'react';
import {
    Zap,
    Loader2,
    X,
    Twitter
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

/** Persisted on RawTweet.generationMode */
export type TweetArticleGenerationMode = "standalone" | "commentary";

interface GenerateArticleFromXModalProps {
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
}

const GENERATION_PROMPT_MAX_LEN = 4000;

export default function GenerateArticleFromXModal({
    open,
    onOpenChange,
    onGenerate,
    isPending,
    tweetText,
    authorName
}: GenerateArticleFromXModalProps) {
    const [generationPrompt, setGenerationPrompt] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<string>('');
    const [language, setLanguage] = React.useState<string>('English');
    const [generationKind, setGenerationKind] = React.useState<"standalone" | "commentary">("standalone");
    const [fieldErrors, setFieldErrors] = React.useState<{ category?: string }>({});

    const resolvedGenerationMode: TweetArticleGenerationMode =
        generationKind === "standalone" ? "standalone" : "commentary";

    // Reset when opening
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

    // Fetch categories
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
        onGenerate(generationPrompt, selectedCategory, language, resolvedGenerationMode);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl">
                <div className="relative bg-[#1DA1F2] px-8 py-10 overflow-hidden">
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/20 border border-white/10 flex items-center justify-center text-white hover:bg-white/30 transition-all z-20 group"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                            <Twitter className="w-7 h-7 text-[#1DA1F2]" />
                        </div>
                        <div className="space-y-1 text-white">
                            <DialogTitle className="text-2xl font-black tracking-tight">
                                Transform Tweet
                            </DialogTitle>
                            <DialogDescription className="text-blue-50 font-medium">
                                Turn this X post from {authorName || 'X'} into a full news article.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {/* Source Preview */}
                    {tweetText && (
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 italic text-sm text-blue-800">
                           "{tweetText.length > 150 ? tweetText.substring(0, 150) + '...' : tweetText}"
                        </div>
                    )}

                    {/* Category Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black text-xs">01</span>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Category <span className="text-red-500">*</span></label>
                        </div>
                        
                        <CategorySelectWithOther
                            value={selectedCategory}
                            onValueChange={handleCategoryChange}
                            categories={categories ?? []}
                            isLoading={isLoadingCategories}
                            placeholder="Select target category"
                            triggerClassName={`w-full h-14 rounded-2xl bg-gray-50 text-base font-bold text-gray-900 focus-visible:ring-blue-500/20 shadow-sm transition-all ${
                                fieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-100"
                            }`}
                            error={fieldErrors.category}
                        />
                    </div>

                    {/* Generation mode */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-black text-xs">02</span>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Generation mode</label>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-1">
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
                                className={`cursor-pointer text-left rounded-2xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                                    generationKind === "commentary"
                                        ? "border-amber-400 bg-amber-50/80 shadow-sm ring-2 ring-amber-200/60"
                                        : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                                }`}
                            >
                                <p className="text-sm font-black uppercase tracking-wide text-gray-900">Social Commentary</p>
                                <p className="mt-1 text-sm font-medium text-gray-600 leading-snug">
                                    Includes an embedded reproduction of the post in the article. Use Custom Prompt below for angle, stance, or emphasis.
                                </p>
                            </div>

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
                                className={`cursor-pointer text-left rounded-2xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                    generationKind === "standalone"
                                        ? "border-blue-400 bg-blue-50/50 shadow-sm ring-2 ring-blue-200/50"
                                        : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                                }`}
                            >
                                <p className="text-sm font-black uppercase tracking-wide text-gray-900">Independent Report</p>
                                <p className="mt-1 text-sm font-medium text-gray-600 leading-snug">
                                    Full news article using the post as a primary source. No social-style embed block; reads like standard reporting.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-black text-xs">03</span>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Output Language</label>
                        </div>
                        
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-full h-14 rounded-2xl bg-gray-50 border-gray-100 text-base font-bold text-gray-900 focus-visible:ring-blue-500/20 shadow-sm">
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGE_OPTIONS.map((lang) => (
                                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-black text-xs">04</span>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">
                                Custom Prompt {generationKind === "commentary" ? "(Recommended)" : "(Optional)"}
                            </label>
                        </div>
                        <Textarea
                            value={generationPrompt}
                            onChange={(e) => setGenerationPrompt(e.target.value.slice(0, GENERATION_PROMPT_MAX_LEN))}
                            placeholder={
                                generationKind === "commentary"
                                    ? "e.g. Take a supportive angle on the thesis; criticize the government's response; emphasize economic impact…"
                                    : "e.g. Focus on the political implications, write for a tech-savvy audience…"
                            }
                            className="min-h-[120px] rounded-2xl bg-gray-50 border-gray-100 p-4 text-base font-medium focus:ring-blue-500/20 resize-none transition-all"
                            disabled={isPending}
                        />
                    </div>
                </div>

                <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-row items-center justify-between gap-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold text-gray-500 px-6 h-12" disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isPending || !selectedCategory}
                        className="flex-1 max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-base shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 fill-white" />
                                <span>Generate Article</span>
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
