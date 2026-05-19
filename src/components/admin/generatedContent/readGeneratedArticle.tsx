"use client";

import React from 'react';
import {
    X,
    Zap,
    Calendar,
    Globe,
    Tag,
    Copy,
    Check,
    ExternalLink,
    User,
    Layout,
    Loader2,
    Star,
    FileText,
    ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { Article } from '@/lib/types';
import { format } from 'date-fns';
import { getCategoryLabel } from '@/config/categories';
import { normalizeCategoryName } from '@/lib/categoryDisplay';
import { extractYoutubeId } from '@/lib/utils';
import TwitterStatusEmbed from '@/components/article/TwitterStatusEmbed';
import { StoryImage } from '@/components/StoryImage';
import ConfirmationModal from '@/components/admin/shared/ConfirmationModal';
import RegeneratePromptDialog, {
    type RegeneratePromptType,
} from '@/components/admin/generatedContent/RegeneratePromptDialog';
import {
    isSocialCommentaryGenerationMode,
    splitReferenceLineFromContent,
    stripOriginalPostBlock,
} from '@/lib/tweetArticleDisplay';

interface ReadGeneratedArticleProps {
    article: Article | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ReadGeneratedArticle({
    article,
    open,
    onOpenChange,
}: ReadGeneratedArticleProps) {
    const queryClient = useQueryClient();
    const [copied, setCopied] = React.useState(false);
    const [displayArticle, setDisplayArticle] = React.useState<Article | null>(article);
    const [isHeadline, setIsHeadline] = React.useState(article?.isHeadline ?? false);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [regenerateError, setRegenerateError] = React.useState<string | null>(null);
    const [regeneratePromptType, setRegeneratePromptType] =
        React.useState<RegeneratePromptType | null>(null);

    // Sync state when article or open changes
    React.useEffect(() => {
        if (open && article) {
            setDisplayArticle(article);
            setIsHeadline(article.isHeadline ?? false);
            setRegenerateError(null);
        }
    }, [open, article]);

    const headlineMutation = useMutation({
        mutationFn: (val: boolean) => {
            if (!displayArticle) throw new Error("No article selected");
            return articlesApi.updateArticle(displayArticle.id, { isHeadline: val });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['generatedArticles']
            });
        },
        onError: (error: any) => {
            console.error("Failed to update headline status:", error);
            // Revert local state on error
            setIsHeadline(displayArticle?.isHeadline ?? false);
        }
    });

    const regenerateTextMutation = useMutation({
        mutationFn: (generationPrompt: string) => {
            if (!displayArticle) throw new Error("No article selected");
            return articlesApi.regenerateGeneratedArticle(
                displayArticle.id,
                "text",
                generationPrompt
            );
        },
        onSuccess: (updated) => {
            setDisplayArticle(updated);
            setRegenerateError(null);
            setRegeneratePromptType(null);
            queryClient.invalidateQueries({ queryKey: ["generatedArticles"] });
        },
        onError: (error: Error) => {
            setRegenerateError(error.message || "Failed to regenerate text");
        },
    });

    const regenerateImageMutation = useMutation({
        mutationFn: (generationPrompt: string) => {
            if (!displayArticle) throw new Error("No article selected");
            return articlesApi.regenerateGeneratedArticle(
                displayArticle.id,
                "image",
                generationPrompt
            );
        },
        onSuccess: (updated) => {
            setDisplayArticle(updated);
            setRegenerateError(null);
            setRegeneratePromptType(null);
            queryClient.invalidateQueries({ queryKey: ["generatedArticles"] });
        },
        onError: (error: Error) => {
            setRegenerateError(error.message || "Failed to regenerate image");
        },
    });

    const handleRegenerateConfirm = (prompt: string) => {
        if (regeneratePromptType === "text") {
            regenerateTextMutation.mutate(prompt);
        } else if (regeneratePromptType === "image") {
            regenerateImageMutation.mutate(prompt);
        }
    };

    const isRegenerating =
        regenerateTextMutation.isPending || regenerateImageMutation.isPending;

    const toggleHeadline = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirmHeadline = async () => {
        const newVal = !isHeadline;

        // Close modal immediately
        setIsConfirmOpen(false);

        try {
            await headlineMutation.mutateAsync(newVal);
            // Reflect change only after success
            setIsHeadline(newVal);
        } catch (error) {
            console.error("Headline update failed:", error);
        }
    };

    if (!article || !displayArticle) return null;

    const publishDate = displayArticle.publishDate || displayArticle.createdAt;
    const authorName = displayArticle.user ? `${displayArticle.user.firstName}` : 'System';
    const originalUrl =
        displayArticle.rawArticle?.crawledUrl?.url ||
        displayArticle.rawVideo?.youtubeUrl ||
        displayArticle.youtubeUrl;

    const rawTweet = displayArticle.rawTweet;
    const rawVideo = displayArticle.rawVideo;

    const isCommentaryTweetArticle =
        displayArticle.sourceType === 'TWEET' &&
        isSocialCommentaryGenerationMode(rawTweet?.generationMode);

    const isCommentaryVideoArticle =
        displayArticle.sourceType === 'VIDEO' &&
        isSocialCommentaryGenerationMode(rawVideo?.generationMode);

    const ytUrl = rawVideo?.youtubeUrl || displayArticle.youtubeUrl;
    const ytId = ytUrl ? extractYoutubeId(ytUrl) : null;
    const legacyVideoNoRow =
        displayArticle.sourceType === 'VIDEO' && Boolean(ytId) && !rawVideo;

    const showYoutubeReaderEmbed =
        Boolean(ytId) &&
        (displayArticle.sourceType !== 'VIDEO' ||
            isCommentaryVideoArticle ||
            legacyVideoNoRow);

    const showTweetCommentaryEmbed =
        isCommentaryTweetArticle && Boolean(rawTweet?.tweetId);

    const isCommentaryLayoutArticle =
        isCommentaryTweetArticle || isCommentaryVideoArticle;

    const bodyContent = isCommentaryLayoutArticle
        ? stripOriginalPostBlock(displayArticle.content ?? '')
        : (displayArticle.content ?? '');

    const { main: layoutMain, referenceLine } = splitReferenceLineFromContent(
        bodyContent,
        isCommentaryLayoutArticle
    );

    const displayImageUrl =
        displayArticle.imageUrl || displayArticle.rawArticle?.imageUrl;

    const handleCopy = () => {
        if (bodyContent) {
            navigator.clipboard.writeText(bodyContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                aria-describedby={undefined}
                className="w-[95vw] sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-none bg-white shadow-2xl flex flex-col"
            >
                {/* ── TOP HEADLINE PRIORITY CONTROL ── */}
                <motion.div
                    animate={{
                        backgroundColor: isHeadline ? '#ea580c' : '#f9fafb',
                        borderColor: isHeadline ? '#f97316' : '#e5e7eb'
                    }}
                    className="relative px-6 sm:px-8 py-4 flex items-center justify-between transition-all duration-500 flex-shrink-0 z-30 border-b-2"
                >
                    <AnimatePresence>
                        {headlineMutation.isPending && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-[40] flex items-center justify-center gap-3"
                            >
                                <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Updating Spotlight...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{
                                scale: isHeadline ? 1.1 : 1,
                                rotate: isHeadline ? 12 : 0,
                                backgroundColor: isHeadline ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,1)'
                            }}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500 ${isHeadline ? 'text-white' : 'text-gray-400 border border-gray-200'
                                }`}>
                            <Layout className="w-6 h-6" />
                        </motion.div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 ${isHeadline ? 'text-orange-200' : 'text-gray-400'
                                }`}>Editorial Priority</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-base font-black leading-none ${isHeadline ? 'text-white' : 'text-gray-900'
                                    }`}>Headline Spotlight</span>
                                {isHeadline && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="px-2 py-0.5 bg-white text-orange-600 text-[9px] font-black rounded-full"
                                    >
                                        ACTIVE
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isHeadline && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hidden sm:block text-xs font-bold text-orange-100 italic"
                            >
                                This article is currently featured on the hero section
                            </motion.span>
                        )}
                        <button
                            type="button"
                            disabled={headlineMutation.isPending}
                            onClick={toggleHeadline}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isHeadline ? "bg-orange-400 shadow-inner" : "bg-gray-300"
                                }`}
                        >
                            <motion.span
                                animate={{ x: isHeadline ? 20 : 0 }}
                                className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-0 transition duration-300 ease-in-out"
                            />
                            {headlineMutation.isPending && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                </div>
                            )}
                        </button>
                    </div>
                </motion.div>
                {/* Header with AI/Admin Aesthetic */}
                <div className="relative bg-gray-900 px-6 sm:px-8 py-8 sm:py-10 overflow-hidden flex-shrink-0 isolation-auto">
                    {/* Background Glow - Reduced blur for performance */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[60px] -mr-32 -mt-32 pointer-events-none" />

                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all z-20 group"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>

                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white/20" />
                        </div>
                        <div className="space-y-2 sm:space-y-3 pr-8 sm:pr-12">
                            <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight line-clamp-2 sm:line-clamp-none">
                                {displayArticle.title}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex items-center gap-2 text-gray-400 text-[10px] sm:text-xs md:text-sm font-bold">
                                    <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                                    {normalizeCategoryName(displayArticle.category?.categoryName) ? (
                                        <span>{getCategoryLabel(displayArticle.category?.categoryName ?? "")}</span>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-[10px] sm:text-xs md:text-sm font-bold">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                                    <span>{format(new Date(publishDate), "MMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-[10px] sm:text-xs md:text-sm font-bold">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                                    <span className="truncate max-w-[120px] sm:max-w-[200px]">
                                        {authorName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area - Optimized for smooth scrolling with GPU acceleration */}
                <motion.div className="relative px-4 sm:px-8 py-6 sm:py-8 space-y-6 overflow-y-auto overscroll-contain flex-1 min-h-0 bg-gray-50/30 will-change-transform [-webkit-overflow-scrolling:touch]">
                    <AnimatePresence>
                        {isRegenerating && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 bg-white/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3"
                            >
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                                    {regenerateImageMutation.isPending
                                        ? "Regenerating image…"
                                        : "Regenerating text…"}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {regenerateError ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {regenerateError}
                        </div>
                    ) : null}

                    {displayImageUrl && !showYoutubeReaderEmbed && (
                        <div className="relative w-full rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-md mb-6 border border-gray-100 bg-gray-100">
                            <StoryImage
                                src={displayImageUrl}
                                alt={displayArticle.title}
                                width={1536}
                                height={1024}
                                className="w-full h-auto max-h-[min(55vh,28rem)] object-contain"
                                sizes="(max-width: 800px) 100vw, 800px"
                            />
                            <div className="absolute top-4 left-4 px-3 py-1 bg-indigo-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                                Feature Image
                            </div>

                            {isHeadline && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute bottom-4 right-4 px-4 py-2 bg-orange-600/90 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-orange-400 flex items-center gap-2"
                                >
                                    <Star className="w-4 h-4 fill-white animate-pulse" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Active Headline Content</span>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {showYoutubeReaderEmbed ? (
                        <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-md mb-6">
                            <iframe
                                src={`https://www.youtube.com/embed/${ytId}`}
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full border-0"
                            />
                        </div>
                    ) : null}

                    {showTweetCommentaryEmbed && rawTweet?.tweetId ? (
                        <div className="mb-6 flex justify-center">
                            <TwitterStatusEmbed
                                tweetId={rawTweet.tweetId}
                                profileUrl={rawTweet.profileUrl}
                            />
                        </div>
                    ) : null}

                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-sm leading-relaxed text-gray-800 text-base sm:text-lg whitespace-pre-wrap font-medium contain-paint">
                        {layoutMain || referenceLine ? (
                            <>
                                {layoutMain ? (
                                    <div className="whitespace-pre-wrap">{layoutMain}</div>
                                ) : null}
                                {referenceLine ? (
                                    <p
                                        className={
                                            layoutMain
                                                ? "mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500 font-normal"
                                                : "text-sm text-gray-500 font-normal"
                                        }
                                    >
                                        {referenceLine}
                                    </p>
                                ) : null}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 italic">
                                <Zap className="w-12 h-12 mb-4 opacity-20" />
                                <p>No content generated for this article.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Footer Actions */}
                <DialogFooter className="px-6 sm:px-8 py-4 sm:py-6 bg-white border-t border-gray-100 flex flex-col gap-3 sm:gap-4 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isRegenerating || headlineMutation.isPending}
                            onClick={() => setRegeneratePromptType("text")}
                            className="rounded-xl sm:rounded-2xl font-bold h-10 sm:h-12 px-4 sm:px-5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                            {regenerateTextMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FileText className="w-4 h-4 mr-2" />
                            )}
                            Regenerate Text
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isRegenerating || headlineMutation.isPending}
                            onClick={() => setRegeneratePromptType("image")}
                            className="rounded-xl sm:rounded-2xl font-bold h-10 sm:h-12 px-4 sm:px-5 border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                            {regenerateImageMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <ImageIcon className="w-4 h-4 mr-2" />
                            )}
                            Regenerate Image
                        </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCopy}
                            disabled={isRegenerating}
                            className={`rounded-xl sm:rounded-2xl font-bold h-10 sm:h-12 px-4 sm:px-6 transition-all border-gray-200 ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'hover:bg-gray-50'
                                }`}
                        >
                            {copied ? (
                                <><Check className="w-4 h-4 mr-2" /> Copied!</>
                            ) : (
                                <><Copy className="w-4 h-4 mr-2" /> Copy Content</>
                            )}
                        </Button>
                        {originalUrl && (
                            <a
                                href={originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 h-10 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm group"
                            >
                                <Globe className="w-4 h-4" />
                                Visit Original
                                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                            </a>
                        )}
                    </div>
                    <Button
                        onClick={() => onOpenChange(false)}
                        disabled={isRegenerating}
                        className="rounded-xl sm:rounded-2xl font-black bg-gray-900 text-white hover:bg-gray-800 px-6 sm:px-8 h-10 sm:h-12 shadow-lg transition-all"
                    >
                        Close Reader
                    </Button>
                    </div>
                </DialogFooter>

                <ConfirmationModal
                    isOpen={isConfirmOpen}
                    onOpenChange={setIsConfirmOpen}
                    onConfirm={handleConfirmHeadline}
                    title={isHeadline ? "Remove from Headline?" : "Set as Headline?"}
                    description={isHeadline
                        ? "This article will no longer be featured in the hero spotlight of your site."
                        : "This will make this article the primary feature on your site's landing page. Any existing headline will be replaced."
                    }
                    confirmText={isHeadline ? "Yes, Remove" : "Yes, Set Headline"}
                    variant={isHeadline ? "warning" : "default"}
                    isLoading={headlineMutation.isPending}
                />
            </DialogContent>
        </Dialog>

        <RegeneratePromptDialog
            open={regeneratePromptType !== null}
            onOpenChange={(next) => {
                if (!next && !isRegenerating) setRegeneratePromptType(null);
            }}
            type={regeneratePromptType ?? "text"}
            onConfirm={handleRegenerateConfirm}
            isPending={isRegenerating}
        />
        </>
    );
}
