"use client";

import React from "react";
import {
    Zap,
    Upload,
    FileText,
    Image as ImageIcon,
    File,
    X,
    Check,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import YoutubeGenerationTab from "./YoutubeGenerationTab";
import { ManualArticleContext, ManualMaterialsUpload } from "./ManualGenerationTab";
import CategorySelectWithOther from "@/components/admin/shared/CategorySelectWithOther";

interface CreateArticleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateArticleModal({
    open,
    onOpenChange,
}: CreateArticleModalProps) {
    const [activeTab, setActiveTab] = React.useState<"manual" | "youtube">("manual");
    const [topic, setTopic] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [youtubeUrl, setYoutubeUrl] = React.useState("");
    const [isTranscribing, setIsTranscribing] = React.useState(false);
    const [youtubeVideoId, setYoutubeVideoId] = React.useState("");
    const [youtubeTranscript, setYoutubeTranscript] = React.useState("");
    const [youtubePrompt, setYoutubePrompt] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<{
        category?: string;
        topic?: string;
        transcript?: string;
    }>({});
    const [transcriptError, setTranscriptError] = React.useState<string | null>(null);
    const [isProcessingFiles, setIsProcessingFiles] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);

    const resetForm = React.useCallback(() => {
        setTopic("");
        setYoutubeTranscript("");
        setYoutubeUrl("");
        setFiles([]);
        setUploadProgress(null);
        setFieldErrors({});
        setError(null);
        setIsProcessingFiles(false);
        setYoutubeVideoId("");
        setYoutubePrompt("");
        setSelectedCategory("");
        setTranscriptError(null);
    }, []);

    // Reset form when modal closes
    React.useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open, resetForm]);

    const queryClient = useQueryClient();

    const handleCategoryChange = (val: string) => {
        setSelectedCategory(val);
        setFieldErrors(prev => ({ ...prev, category: undefined }));
    };

    const handleTopicChange = (val: string) => {
        setTopic(val);
        setFieldErrors(prev => ({ ...prev, topic: undefined }));
    };

    const handleTranscriptChange = (val: string) => {
        setYoutubeTranscript(val);
        setFieldErrors(prev => ({ ...prev, transcript: undefined }));
    };

    // Fetch categories
    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => articlesApi.getCategories(),
    });

    const mutation = useMutation({
        mutationFn: (params: {
            topic?: string;
            categoryId?: string;
            content?: string;
            prompt?: string;
            fileContent?: string;
            imageUrl?: string;
            youtubeUrl?: string;
            type?: "manual" | "youtube";
        }) => articlesApi.generateManualArticle(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
            onOpenChange(false);
            // resetForm will be called by the useEffect hook
        },
        onError: (err: any) => {
            setError(err.message || "Failed to generate article.");
            setIsProcessingFiles(false);
        }
    });

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || "");
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    const uploadFileWithPresignedUrl = async (file: File): Promise<string | null> => {
        try {
            // 1. Get presigned URL
            const { url, key } = await articlesApi.getUploadUrl(file.name, file.type);
            
            // 2. Upload directly to S3
            const uploadRes = await fetch(url, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadRes.ok) throw new Error("Failed to upload to S3 via presigned URL");

            // 3. Return the key/URL (we'll use the cloudfront URL + key)
            const cloudfrontUrl = (process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "").replace(/\/$/, "");
            return cloudfrontUrl ? `${cloudfrontUrl}/${key}` : key;
        } catch (err) {
            console.error("Presigned Upload error:", err);
            return null;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const incomingFiles = Array.from(e.target.files);
            
            setFiles(prev => {
                const newImages = incomingFiles.filter(f => f.type.startsWith('image/'));
                const newOthers = incomingFiles.filter(f => !f.type.startsWith('image/'));
                
                // For the manual tab image, we only want one.
                // If new images are uploaded, take the last one and replace existing ones.
                if (newImages.length > 0) {
                    const latestImage = newImages[newImages.length - 1];
                    const existingNonImages = prev.filter(f => !f.type.startsWith('image/'));
                    return [...existingNonImages, ...newOthers, latestImage];
                }
                
                return [...prev, ...newOthers];
            });
            
            setFieldErrors(prev => ({ ...prev, topic: undefined }));
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        setError(null);
        const newErrors: typeof fieldErrors = {};

        // 1. Validate Category (Universal)
        if (!selectedCategory) {
            newErrors.category = "Please select a category";
        }

        // 2. Tab Specific Validation
        let combinedFileContent = "";
        let uploadedImageUrl = "";

        if (activeTab === "manual") {
            // Check files
            const textFiles = files.filter(f => f.name.endsWith('.txt'));
            const imageFiles = files.filter(f => f.type.startsWith('image/'));

            if (!topic.trim() && textFiles.length === 0) {
                newErrors.topic = "Provide a topic or upload .txt materials";
            }

            if (Object.keys(newErrors).length > 0) {
                setFieldErrors(newErrors);
                return;
            }

            setIsProcessingFiles(true);
            try {
                // Read text files
                const texts = await Promise.all(textFiles.map(readFileAsText));
                combinedFileContent = texts.join("\n\n---\n\n");

                // Upload first image if exists
                if (imageFiles.length > 0) {
                    const result = await uploadFileWithPresignedUrl(imageFiles[0]);
                    if (!result) {
                        throw new Error("Failed to upload image. Please try again.");
                    }
                    uploadedImageUrl = result;
                }

                mutation.mutate({
                    topic,
                    categoryId: selectedCategory,
                    fileContent: combinedFileContent,
                    imageUrl: uploadedImageUrl,
                    type: "manual",
                });
            } catch (err: any) {
                setError(err.message || "Failed to process local files.");
                setIsProcessingFiles(false);
            }
        } else {
            if (!youtubeTranscript.trim()) {
                newErrors.transcript = "Transcript is required for generation";
            }

            if (Object.keys(newErrors).length > 0) {
                setFieldErrors(newErrors);
                return;
            }

            mutation.mutate({
                topic: "YouTube Video Article",
                content: youtubeTranscript,
                prompt: youtubePrompt,
                categoryId: selectedCategory,
                youtubeUrl: youtubeUrl,
                type: "youtube",
            });
        }
    };

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

    const isGenerating = mutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl"
            >
                {/* Header with vibrant aesthetic */}
                <div className="relative bg-gray-900 px-8 py-10 overflow-hidden">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all z-20 group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>

                    <div className="relative flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Zap className="w-7 h-7 text-white fill-white/20" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-black text-white tracking-tight">
                                Create Article
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium">
                                Fuel your platform with AI-generated storytelling.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-2 rounded-2xl bg-gray-50 p-1.5 border border-gray-100">
                        <button
                            type="button"
                            onClick={() => setActiveTab("manual")}
                            className={`flex-1 h-10 rounded-xl text-sm font-black tracking-wide transition-all ${activeTab === "manual"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            Manual Generation
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("youtube")}
                            className={`flex-1 h-10 rounded-xl text-sm font-black tracking-wide transition-all ${activeTab === "youtube"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            YouTube Generation
                        </button>
                    </div>

                    {activeTab === "manual" ? (
                        <ManualArticleContext topic={topic} handleTopicChange={handleTopicChange} fieldErrors={fieldErrors} />
                    ) : (
                        <YoutubeGenerationTab
                            youtubeUrl={youtubeUrl}
                            setYoutubeUrl={setYoutubeUrl}
                            handleTranscribeYoutube={handleTranscribeYoutube}
                            isTranscribing={isTranscribing}
                            youtubeVideoId={youtubeVideoId}
                            transcriptError={transcriptError}
                            youtubeTranscript={youtubeTranscript}
                            handleTranscriptChange={handleTranscriptChange}
                            fieldErrors={fieldErrors}
                            youtubePrompt={youtubePrompt}
                            setYoutubePrompt={setYoutubePrompt}
                        />
                    )}

                    {/* Step 2: Configuration - Shared */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black text-xs">02</span>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Configuration</label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category Selection */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Category <span className="text-red-500">*</span></span>
                                <div className="relative">
                                    <CategorySelectWithOther
                                        value={selectedCategory}
                                        onValueChange={handleCategoryChange}
                                        categories={categories ?? []}
                                        isLoading={isLoadingCategories}
                                        placeholder="Select Category"
                                        triggerClassName={`w-full h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all ${
                                            fieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-100"
                                        }`}
                                        contentClassName="max-h-[400px]"
                                        error={fieldErrors.category}
                                    />
                                    {fieldErrors.category && (
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 mt-2 animate-in fade-in slide-in-from-top-1">{fieldErrors.category}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {activeTab === "manual" && (
                            <ManualMaterialsUpload files={files} handleFileChange={handleFileChange} removeFile={removeFile} />
                        )}
                    </div>
                </div>

                {/* Footer with Premium Button */}
                <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-row items-center justify-between gap-4">
                    <div className="flex-1 flex justify-start">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-6 h-12"
                            disabled={isGenerating}
                        >
                            Discard
                        </Button>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || isProcessingFiles || (activeTab === "youtube" && !youtubeTranscript.trim())}
                        className="flex-1 max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                        {isGenerating || isProcessingFiles ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{isProcessingFiles && !isGenerating ? 'Processing...' : 'Generating...'}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 fill-white" />
                                <span>Generate</span>
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
