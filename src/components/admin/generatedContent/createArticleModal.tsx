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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_HIERARCHY } from "@/lib/categories";

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
        }) => articlesApi.generateManualArticle(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
            onOpenChange(false);
            // Reset form
            setTopic("");
            setYoutubeTranscript("");
            setYoutubeUrl("");
            setFiles([]);
            setUploadProgress(null);
            setFieldErrors({});
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

    const uploadFileToSupabase = async (file: File): Promise<string | null> => {
        try {
            const { supabase } = await import("@/lib/supabaseClient");
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
            const filePath = `article-materials/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from('articles') // Assuming "articles" bucket exists
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('articles')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error("Upload error:", err);
            return null;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
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
                    uploadedImageUrl = await uploadFileToSupabase(imageFiles[0]) || "";
                }

                mutation.mutate({
                    topic,
                    categoryId: selectedCategory,
                    fileContent: combinedFileContent,
                    imageUrl: uploadedImageUrl
                });
            } catch (err: any) {
                setError("Failed to process local files: " + err.message);
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
            const baseUrl = (process.env.NEXT_PUBLIC_TRANSCRIPT_API_URL || "http://localhost:8000").replace(/\/$/, "");
            const res = await fetch(`${baseUrl}/transcript`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmedUrl }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const message = typeof data?.detail === "string"
                    ? data.detail
                    : "Failed to transcribe YouTube video.";
                throw new Error(message);
            }

            setYoutubeVideoId(typeof data?.video_id === "string" ? data.video_id : "");
            setYoutubeTranscript(typeof data?.transcript === "string" ? data.transcript : "");
        } catch (err: any) {
            setTranscriptError(err?.message || "Failed to transcribe YouTube video.");
            setYoutubeVideoId("");
            setYoutubeTranscript("");
        } finally {
            setIsTranscribing(false);
        }
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className="w-4 h-4 text-orange-500" />;
        if (['pdf'].includes(ext || '')) return <File className="w-4 h-4 text-red-500" />;
        if (['txt'].includes(ext || '')) return <FileText className="w-4 h-4 text-blue-500" />;
        return <File className="w-4 h-4 text-gray-500" />;
    };
    const isGenerating = mutation.isPending;

    // Filter categories into groups - strictly matching landing page structure
    const groupedCategories = CATEGORY_HIERARCHY.map(group => ({
        label: group.label,
        items: categories?.filter(cat =>
            group.subcategories.some(sub => sub.toLowerCase() === cat.name.toLowerCase())
        ) ?? []
    })).filter(group => group.items.length > 0);

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
                        <>
                            {/* Step 1: Article Context */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-black text-xs">01</span>
                                        <label className="text-sm font-black uppercase tracking-widest text-gray-900">Article Context</label>
                                    </div>
                                </div>
                                <Input
                                    placeholder="What should the article be about? (e.g. Future of EV in 2026)"
                                    value={topic}
                                    onChange={(e) => handleTopicChange(e.target.value)}
                                    className={`h-14 rounded-2xl bg-gray-50 text-base font-medium focus-visible:ring-orange-500/20 transition-all ${
                                        fieldErrors.topic ? "border-red-500 bg-red-50/30" : "border-gray-100"
                                    }`}
                                />
                                {fieldErrors.topic && (
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.topic}</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {/* YouTube fields... no changes to URL input needed unless desired */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">YouTube URL</span>
                                <div className="relative">
                                    <Input
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={youtubeUrl}
                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                        className="h-12 pr-[150px] rounded-xl bg-gray-50 border-gray-100 text-sm font-bold placeholder:text-gray-400 focus-visible:ring-orange-500/20 focus-visible:border-orange-200 shadow-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleTranscribeYoutube}
                                        disabled={isTranscribing}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 rounded-lg font-bold border-gray-200 bg-white"
                                    >
                                        {isTranscribing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Transcribing...
                                            </>
                                        ) : (
                                            "Transcribe"
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {youtubeVideoId && (
                                <div className="text-xs font-bold text-gray-500">
                                    Video ID: <span className="text-gray-900">{youtubeVideoId}</span>
                                </div>
                            )}

                            {transcriptError && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                                    {transcriptError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Transcribed Content</span>
                                <textarea
                                    value={youtubeTranscript}
                                    onChange={(e) => handleTranscriptChange(e.target.value)}
                                    placeholder="Transcript will appear here after transcribing."
                                    className={`w-full min-h-[200px] rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-y transition-all ${
                                        fieldErrors.transcript ? "border-red-500 ring-red-500/10" : "border-gray-100"
                                    }`}
                                />
                                {fieldErrors.transcript && (
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.transcript}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Prompt</span>
                                <textarea
                                    value={youtubePrompt}
                                    onChange={(e) => setYoutubePrompt(e.target.value)}
                                    placeholder="Add writing instructions for the generated article (tone, length, key points, audience)."
                                    className="w-full min-h-[100px] rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 resize-y"
                                />
                            </div>
                        </div>
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
                                    <Select value={selectedCategory} onValueChange={handleCategoryChange} disabled={isLoadingCategories}>
                                        <SelectTrigger className={`w-full h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all ${
                                            fieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-100"
                                        }`}>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[400px]">
                                            {groupedCategories.map((group) => (
                                                <SelectGroup key={group.label}>
                                                    <SelectLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff4500] px-4 py-2 mt-2 border-b border-gray-50">
                                                        {group.label}
                                                    </SelectLabel>
                                                    {group.items.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id} className="pl-6 font-semibold">
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldErrors.category && (
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 mt-2 animate-in fade-in slide-in-from-top-1">{fieldErrors.category}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {activeTab === "manual" && (
                            /* File Upload Area */
                            <div className="space-y-4">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Materials (PDF, TXT, IMAGES)</span>
                                <div
                                    className="relative group border-2 border-dashed border-gray-200 rounded-3xl p-8 transition-all hover:bg-orange-50/50 hover:border-orange-200 flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden shadow-sm"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        accept=".pdf,.txt,image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-500">
                                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-orange-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-900">Click or drag to upload</p>
                                        <p className="text-xs text-gray-400 font-medium mt-1">Enhance generation with your own documents</p>
                                    </div>
                                </div>

                                {/* File List */}
                                <AnimatePresence>
                                    {files.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                        >
                                            {files.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group shadow-sm">
                                                    <div className="flex items-center gap-3 truncate">
                                                        {getFileIcon(file.name)}
                                                        <span className="text-xs font-bold text-gray-700 truncate">{file.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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
