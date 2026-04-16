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
    User
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Article } from '@/lib/types';
import { format } from 'date-fns';

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
    const [copied, setCopied] = React.useState(false);

    if (!article) return null;

    const handleCopy = () => {
        if (article.content) {
            navigator.clipboard.writeText(article.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const publishDate = article.publishDate || article.createdAt;
    const authorName = article.user ? `${article.user.firstName}` : 'System';
    const originalUrl = article.rawArticle?.crawledUrl?.url;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="w-[95vw] sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-none bg-white shadow-2xl flex flex-col"
            >
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
                                {article.title}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex items-center gap-2 text-gray-400 text-[10px] sm:text-xs md:text-sm font-bold">
                                    <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                                    <span>{article.category?.categoryName ?? 'Uncategorized'}</span>
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
                <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-6 overflow-y-auto overscroll-contain flex-1 min-h-0 bg-gray-50/30 will-change-transform [-webkit-overflow-scrolling:touch]">
                    
                    {/* YouTube Embed if available */}
                    {(() => {
                        const youtubeUrl = (article as any).youtubeUrl;
                        const youtubeId = youtubeUrl ? (
                            youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/) || []
                        )[1] : null;

                        if (!youtubeId) return null;

                        return (
                            <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-md mb-6">
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeId}`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full border-0"
                                />
                            </div>
                        );
                    })()}

                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-sm leading-relaxed text-gray-800 text-base sm:text-lg whitespace-pre-wrap font-medium contain-paint">
                        {article.content || (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 italic">
                                <Zap className="w-12 h-12 mb-4 opacity-20" />
                                <p>No content generated for this article.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <DialogFooter className="px-6 sm:px-8 py-4 sm:py-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCopy}
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
                        className="rounded-xl sm:rounded-2xl font-black bg-gray-900 text-white hover:bg-gray-800 px-6 sm:px-8 h-10 sm:h-12 shadow-lg transition-all"
                    >
                        Close Reader
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
