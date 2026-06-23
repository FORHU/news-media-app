"use client";

import React, { useState } from 'react';
import {
    Zap,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import YoutubeGenerationTab from '../../../generatedContent/CreateArticleModal/YoutubeGenerationTab';
import CategorySelectWithOther from '../../../shared/CategorySelectWithOther';
import ArticleGenerationModeSection from '../../../shared/ArticleGenerationModeSection';
import { Button } from '@/components/ui/button';
import type { ArticleGenerationMode } from '@/lib/articleGenerationMode';

export default function Transcribe() {
    const queryClient = useQueryClient();

    // Form State
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [youtubeVideoId, setYoutubeVideoId] = useState("");
    const [youtubeTranscript, setYoutubeTranscript] = useState("");
    const [youtubePrompt, setYoutubePrompt] = useState("");
    const [language, setLanguage] = useState("English");
    const [generationMode, setGenerationMode] =
        useState<ArticleGenerationMode>("standalone");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{ category?: string; transcript?: string }>({});
    const [transcriptError, setTranscriptError] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch categories
    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => articlesApi.getCategories(),
    });

    const mutation = useMutation({
        mutationFn: (params: Parameters<typeof articlesApi.generateManualArticle>[0]) => articlesApi.generateManualArticle(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
            setSuccessMessage("Article generation started successfully!");
            setYoutubeUrl("");
            setYoutubeTranscript("");
            setYoutubeVideoId("");
            setYoutubePrompt("");
            setGenerationMode("standalone");
            setTimeout(() => setSuccessMessage(null), 5000);
        },
        onError: (err: unknown) => {
            setGlobalError(err instanceof Error ? err.message : "Failed to generate article.");
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
        } catch (err: unknown) {
            setTranscriptError(err instanceof Error ? err.message : "Failed to transcribe YouTube video.");
            setYoutubeVideoId("");
            setYoutubeTranscript("");
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleGenerate = async () => {
        setFieldErrors({});
        setGlobalError(null);
        
        const newErrors: { category?: string; transcript?: string } = {};
        if (!selectedCategory) newErrors.category = "Category is required";
        if (!youtubeTranscript.trim()) newErrors.transcript = "Transcript is required";

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        mutation.mutate({
            topic: "YouTube Video Article",
            language,
            content: youtubeTranscript,
            prompt: [youtubePrompt?.trim(), `Write the article in ${language}.`].filter(Boolean).join("\n\n"),
            categoryId: selectedCategory,
            youtubeUrl: youtubeUrl,
            type: "youtube",
            generationMode,
        });
    };

    return (
        <div className="space-y-6">
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

                <div className="mt-8 pt-8 border-t border-gray-50 space-y-8">
                    <ArticleGenerationModeSection
                        variant="youtube"
                        value={generationMode}
                        onChange={setGenerationMode}
                        stepNumber="02"
                    />
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">03</div>
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
    );
}
