"use client";

import React, { useState } from 'react';
import {
    Youtube,
    Zap,
    History,
    Search,
    Loader2,
    ExternalLink,
    Calendar,
    ChevronRight,
    ArrowRight,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import YoutubeGenerationTab from '../generatedContent/CreateArticleModal/YoutubeGenerationTab';
import CategorySelectWithOther from '../shared/CategorySelectWithOther';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/admin/pagination';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function YoutubeManager() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const historyRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (searchParams?.get('view') === 'history') {
            historyRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [searchParams]);

    // Form State
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [youtubeVideoId, setYoutubeVideoId] = useState("");
    const [youtubeTranscript, setYoutubeTranscript] = useState("");
    const [youtubePrompt, setYoutubePrompt] = useState("");
    const [language, setLanguage] = useState("English");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{ category?: string; transcript?: string }>({});
    const [transcriptError, setTranscriptError] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Fetch categories
    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => articlesApi.getCategories(),
    });

    // Fetch history (Filtering YouTube articles client-side for now or using a query)
    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['generatedArticles', 'youtube', currentPage],
        queryFn: () => articlesApi.getGeneratedArticles({
            page: currentPage,
            limit: limit,
            status: 'all' // We want to see all statuses
        }),
    });

    // Filter for YouTube articles only (if the API doesn't support it)
    const youtubeHistory = historyData?.articles.filter(a => a.youtubeUrl) || [];

    const mutation = useMutation({
        mutationFn: (params: any) => articlesApi.generateManualArticle(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
            setSuccessMessage("Article generation started successfully!");
            setYoutubeUrl("");
            setYoutubeTranscript("");
            setYoutubeVideoId("");
            setYoutubePrompt("");
            setTimeout(() => setSuccessMessage(null), 5000);
        },
        onError: (err: any) => {
            setGlobalError(err.message || "Failed to generate article.");
        }
    });

    const handleTranscribeYoutube = async () => {
        const trimmedUrl = youtubeUrl.trim();
        if (!trimmedUrl) {
            setTranscriptError("Please enter a YouTube URL.");
            return;
        }

        setIsTranscribing(true);
        setTranscriptError(null);

        try {
            const data = await articlesApi.transcribeYoutube(trimmedUrl);
            setYoutubeVideoId(data.video_id || "");
            setYoutubeTranscript(data.transcript || "");
        } catch (err: any) {
            setTranscriptError(err?.message || "Failed to transcribe YouTube video.");
            setYoutubeVideoId("");
            setYoutubeTranscript("");
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleGenerate = async () => {
        setFieldErrors({});
        setGlobalError(null);
        
        const newErrors: any = {};
        if (!selectedCategory) newErrors.category = "Category is required";
        if (!youtubeTranscript.trim()) newErrors.transcript = "Transcript is required";

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        mutation.mutate({
            topic: "YouTube Video Article",
            content: youtubeTranscript,
            prompt: [youtubePrompt?.trim(), `Write the article in ${language}.`].filter(Boolean).join("\n\n"),
            categoryId: selectedCategory,
            youtubeUrl: youtubeUrl,
            type: "youtube",
        });
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-2xl">
                        <Youtube className="w-10 h-10 text-red-600" />
                    </div>
                    YouTube <span className="text-red-600">Conversion</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg">
                    Transform any YouTube video into a high-quality news article instantly.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Input Form */}
                <div className="lg:col-span-7 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-100"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">01</div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Transcription Details</h2>
                        </div>

                        <YoutubeGenerationTab
                            youtubeUrl={youtubeUrl}
                            setYoutubeUrl={setYoutubeUrl}
                            handleTranscribeYoutube={handleTranscribeYoutube}
                            isTranscribing={isTranscribing}
                            youtubeVideoId={youtubeVideoId}
                            transcriptError={transcriptError}
                            youtubeTranscript={youtubeTranscript}
                            handleTranscriptChange={setYoutubeTranscript}
                            fieldErrors={fieldErrors}
                            youtubePrompt={youtubePrompt}
                            setYoutubePrompt={setYoutubePrompt}
                            language={language}
                            setLanguage={setLanguage}
                        />

                        <div className="mt-8 pt-8 border-t border-gray-50 space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">02</div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Final Configuration</h2>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Category <span className="text-red-500">*</span></span>
                                <CategorySelectWithOther
                                    value={selectedCategory}
                                    onValueChange={setSelectedCategory}
                                    categories={categories ?? []}
                                    isLoading={isLoadingCategories}
                                    placeholder="Select Category"
                                    triggerClassName={`w-full h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-red-500/20 shadow-sm transition-all ${fieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-100"}`}
                                />
                                {fieldErrors.category && (
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 mt-2">{fieldErrors.category}</p>
                                )}
                            </div>

                            {globalError && (
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {globalError}
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-green-600 text-sm font-bold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {successMessage}
                                </div>
                            )}

                            <Button
                                onClick={handleGenerate}
                                disabled={mutation.isPending || !youtubeTranscript.trim()}
                                className="w-full h-16 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-lg shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
                            >
                                {mutation.isPending ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Generating Article...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-6 h-6 fill-white" />
                                        <span>Generate Now</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Right: History Table */}
                <div ref={historyRef} className="lg:col-span-5 space-y-6">
                    <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-gray-100 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <History className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent History</h2>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => router.push('/admin/dashboard/generated')}
                                className="text-xs font-bold text-gray-500 hover:text-red-600"
                            >
                                View All
                                <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>

                        {isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-8 h-8 text-red-200 animate-spin" />
                                <p className="text-sm font-bold text-gray-400">Loading history...</p>
                            </div>
                        ) : youtubeHistory.length > 0 ? (
                            <div className="space-y-4">
                                {youtubeHistory.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="group p-4 bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow-md hover:border-red-100 transition-all cursor-pointer"
                                        onClick={() => router.push(`/admin/dashboard/generated?id=${item.id}`)}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    item.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                {item.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                                                    <Youtube className="w-3 h-3 text-red-600" />
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400 truncate max-w-[200px]">
                                                    {item.youtubeUrl}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                
                                <div className="pt-6">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={historyData?.pagination.totalPages || 1}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <History className="w-8 h-8 text-gray-200" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">No YouTube History</h3>
                                <p className="text-sm text-gray-400 font-medium">Your generated articles from YouTube will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
