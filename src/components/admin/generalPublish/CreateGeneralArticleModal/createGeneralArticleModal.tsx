"use client";

import React from "react";
import {
    Zap,
    X,
    Loader2,
    PenLine,
    Save,
    Send,
    Layout,
    Rss,
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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { motion } from "framer-motion";
import {
    LANGUAGE_OPTIONS,
    ManualArticleContext,
    ManualMaterialsUpload,
    ManualArticleImage
} from "@/components/admin/generatedContent/CreateArticleModal/ManualGenerationTab";
import GeneralCategorySelect from "@/components/admin/generalPublish/GeneralCategorySelect";
import { ManualArticleImages } from "@/components/admin/generalPublish/ManualArticleImages";
import FeaturedImageChoiceSection from "@/components/admin/shared/FeaturedImageChoiceSection";

type CreateArticleTab = "ai" | "manual";

async function uploadImageToS3(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload-image-presigned", {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || "Failed to upload image");
    }
    const { publicUrl } = await res.json();
    return publicUrl;
}

interface CreateGeneralArticleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateGeneralArticleModal({
    open,
    onOpenChange,
}: CreateGeneralArticleModalProps) {
    const [topic, setTopic] = React.useState("");
    const [language, setLanguage] = React.useState("English");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [pastedText, setPastedText] = React.useState("");
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [generateNewImage, setGenerateNewImage] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<{
        category?: string;
        topic?: string;
        materials?: string;
    }>({});
    const [isProcessingFiles, setIsProcessingFiles] = React.useState(false);
    const [, setUploadProgress] = React.useState<number | null>(null);

    // Manual (non-AI) entry tab
    const [activeTab, setActiveTab] = React.useState<CreateArticleTab>("ai");
    const [manualTitle, setManualTitle] = React.useState("");
    const [manualContent, setManualContent] = React.useState("");
    const [manualCategory, setManualCategory] = React.useState("");
    const [manualImageFiles, setManualImageFiles] = React.useState<File[]>([]);
    const [manualIsHeadline, setManualIsHeadline] = React.useState(false);
    const [manualFieldErrors, setManualFieldErrors] = React.useState<{
        title?: string;
        content?: string;
        category?: string;
    }>({});
    const [manualError, setManualError] = React.useState<string | null>(null);
    const [isSubmittingManual, setIsSubmittingManual] = React.useState(false);

    const resetForm = React.useCallback(() => {
        setTopic("");
        setFiles([]);
        setPastedText("");
        setImageFile(null);
        setUploadProgress(null);
        setFieldErrors({});
        setError(null);
        setIsProcessingFiles(false);
        setSelectedCategory("");
        setLanguage("English");
        setGenerateNewImage(false);
        setActiveTab("ai");
        setManualTitle("");
        setManualContent("");
        setManualCategory("");
        setManualImageFiles([]);
        setManualIsHeadline(false);
        setManualFieldErrors({});
        setManualError(null);
        setIsSubmittingManual(false);
    }, []);

    // Reset form when modal closes — during render, no effect.
    const [prevDeps, setPrevDeps] = React.useState({ open, resetForm });
    if (open !== prevDeps.open || resetForm !== prevDeps.resetForm) {
        setPrevDeps({ open, resetForm });
        if (!open) {
            resetForm();
        }
    }

    const queryClient = useQueryClient();

    const handleCategoryChange = (val: string) => {
        setSelectedCategory(val);
        setFieldErrors(prev => ({ ...prev, category: undefined }));
    };

    const handleTopicChange = (val: string) => {
        setTopic(val);
        setFieldErrors(prev => ({ ...prev, topic: undefined }));
    };

    const onPastedTextChange = (val: string) => {
        setPastedText(val);
        setFieldErrors(prev => ({ ...prev, materials: undefined }));
    };

    const handleMaterialsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e);
        setFieldErrors(prev => ({ ...prev, materials: undefined }));
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || "");
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    const readFileAsPdfText = async (file: File): Promise<string> => {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
        ).toString();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const pageTexts: string[] = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item) => ("str" in item ? item.str : ""))
                .join(" ");
            pageTexts.push(pageText);
        }

        return pageTexts.join("\n\n");
    };

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const incomingFiles = Array.from(e.target.files);
            const validFiles = incomingFiles.filter(f =>
                f.name.endsWith('.txt') || f.type === 'application/pdf' || f.type.startsWith('image/')
            );
            setFiles(prev => [...prev, ...validFiles]);
            setFieldErrors(prev => ({ ...prev, topic: undefined }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeImage = () => {
        setImageFile(null);
    };

    const buildLanguageDirective = React.useCallback((selectedLanguage: string) => {
        const lang = (selectedLanguage || "English").trim() || "English";
        return `Write the entire article in ${lang}.`;
    }, []);

    const handleGenerate = async () => {
        setError(null);
        const newErrors: typeof fieldErrors = {};

        if (!selectedCategory) {
            newErrors.category = "Please select a category";
        }

        if (!topic.trim()) {
            newErrors.topic = "Generation prompt is required";
        }

        if (!pastedText.trim() && files.length === 0) {
            newErrors.materials = "Please provide at least one source (pasted content or document)";
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        let combinedFileContent = pastedText.trim();
        let uploadedImageUrl = "";

        const textFiles = files.filter(f => f.name.endsWith('.txt'));
        const imageMaterialFiles = files.filter(f => f.type.startsWith('image/'));
        const pdfMaterialFiles = files.filter(f => f.type === 'application/pdf');

        setIsProcessingFiles(true);
        try {
            const [texts, pdfTexts] = await Promise.all([
                Promise.all(textFiles.map(readFileAsText)),
                Promise.all(pdfMaterialFiles.map(readFileAsPdfText)),
            ]);
            const allTexts = [...texts, ...pdfTexts].join("\n\n---\n\n");

            if (allTexts) {
                combinedFileContent = combinedFileContent
                    ? `${combinedFileContent}\n\n[FILE ATTACHMENTS]\n${allTexts}`
                    : allTexts;
            }

            const materialImages = await Promise.all(imageMaterialFiles.map(readFileAsBase64));

            if (imageFile) {
                uploadedImageUrl = await readFileAsBase64(imageFile);
            }

            await articlesApi.createGeneralArticleFromUpload({
                category: selectedCategory,
                topic,
                extractedText: combinedFileContent,
                s3ImageUrl: uploadedImageUrl,
                language,
                prompt: buildLanguageDirective(language),
                materialImages,
            });

            queryClient.invalidateQueries({ queryKey: ['generalPublishes'] });
            onOpenChange(false);
        } catch (err: unknown) {
            console.error("General AI Generation Error:", err);
            setError(err instanceof Error ? err.message : "Failed to process local files.");
            setIsProcessingFiles(false);
        }
    };

    const handleManualImagesAdded = (newFiles: File[]) => {
        setManualImageFiles(prev => [...prev, ...newFiles]);
    };

    const removeManualImage = (index: number) => {
        setManualImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleManualCreate = async (publish: boolean) => {
        setManualError(null);
        const newErrors: typeof manualFieldErrors = {};

        if (!manualTitle.trim()) newErrors.title = "Title is required";
        if (!manualContent.trim()) newErrors.content = "Article content is required";
        if (!manualCategory) newErrors.category = "Please select a category";

        if (Object.keys(newErrors).length > 0) {
            setManualFieldErrors(newErrors);
            return;
        }

        setIsSubmittingManual(true);
        try {
            const uploadedImageUrls = manualImageFiles.length > 0
                ? await Promise.all(manualImageFiles.map(uploadImageToS3))
                : [];

            await articlesApi.createGeneralManualArticle({
                title: manualTitle.trim(),
                content: manualContent.trim(),
                category: manualCategory,
                imageUrls: uploadedImageUrls,
                isHeadline: manualIsHeadline,
                publish,
            });

            queryClient.invalidateQueries({ queryKey: ['generalPublishes'] });
            onOpenChange(false);
        } catch (err: unknown) {
            console.error("General Manual Article Creation Error:", err);
            setManualError(err instanceof Error ? err.message : "Failed to create article.");
        } finally {
            setIsSubmittingManual(false);
        }
    };

    const isModalBusy = activeTab === "ai" ? isProcessingFiles : isSubmittingManual;
    const showAiCraftingScreen = activeTab === "ai" && isProcessingFiles;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[840px] p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl"
            >
                {showAiCraftingScreen ? (
                    <div className="relative min-h-[500px] flex flex-col items-center justify-center gap-6 px-10 py-16 bg-gradient-to-b from-white to-orange-50/40 overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-50">
                            <div className="absolute -top-20 -left-12 w-48 h-48 rounded-full bg-orange-100 blur-3xl" />
                            <div className="absolute -bottom-20 -right-12 w-52 h-52 rounded-full bg-orange-200/60 blur-3xl" />
                        </div>

                        <div className="relative w-20 h-20 rounded-3xl bg-white border border-orange-100 shadow-lg flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        </div>

                        <div className="relative text-center space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Broadcasting Your Article</h3>
                            <p className="text-sm font-medium text-gray-600 max-w-md">
                                We are generating the article, then publishing it to every eligible site. This can take a moment.
                            </p>
                        </div>

                        <div className="relative w-full max-w-md space-y-4">
                            <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                                    initial={{ width: "18%" }}
                                    animate={{ width: ["18%", "52%", "84%", "96%"] }}
                                    transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                <div className="px-3 py-2 rounded-lg bg-white/90 border border-orange-100 text-center">Generating</div>
                                <div className="px-3 py-2 rounded-lg bg-white/90 border border-orange-100 text-center">Resolving Sites</div>
                                <div className="px-3 py-2 rounded-lg bg-white/90 border border-orange-100 text-center">Publishing</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative bg-gray-900 px-8 py-10 overflow-hidden">
                            <button
                                onClick={() => onOpenChange(false)}
                                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all z-20 group"
                            >
                                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                            </button>

                            <div className="relative flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Rss className="w-7 h-7 text-white fill-white/20" />
                                </div>
                                <div className="space-y-1">
                                    <DialogTitle className="text-2xl font-black text-white tracking-tight">
                                        Create Broadcast Article
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-400 font-medium">
                                        {activeTab === "ai"
                                            ? "Publishes to every eligible site at once, aside from the Jeju sites."
                                            : "Write once, publish everywhere — aside from the Jeju sites."}
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="relative inline-flex items-center gap-1 p-1 mt-6 bg-white/5 border border-white/10 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("ai")}
                                    disabled={isModalBusy}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "ai" ? "bg-white text-gray-900 shadow" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    AI Generate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("manual")}
                                    disabled={isModalBusy}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "manual" ? "bg-white text-gray-900 shadow" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    <PenLine className="w-3.5 h-3.5" />
                                    Manual Entry
                                </button>
                            </div>
                        </div>

                        <div className="px-8 py-8 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
                            {activeTab === "ai" ? (
                                <>
                            {error && (
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <ManualMaterialsUpload
                                files={files}
                                handleFileChange={handleMaterialsFileChange}
                                removeFile={removeFile}
                                pastedText={pastedText}
                                onPastedTextChange={onPastedTextChange}
                                error={fieldErrors.materials}
                            />

                            <ManualArticleImage
                                imageFile={imageFile}
                                handleImageChange={handleImageChange}
                                removeImage={removeImage}
                            />

                            <ManualArticleContext
                                topic={topic}
                                handleTopicChange={handleTopicChange}
                                fieldErrors={fieldErrors}
                            />

                            <FeaturedImageChoiceSection
                                value={generateNewImage}
                                onChange={setGenerateNewImage}
                                disabled={isModalBusy}
                                stepNumber="04"
                                offLabel="No AI image"
                                offDescription="Use your upload only, or skip a thumbnail for now."
                                onLabel="Generate with AI"
                                onDescription="Create a new featured image from the generated article."
                                borderedTop
                            />

                            <div className="space-y-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-black text-xs">05</span>
                                    <label className="text-sm font-black uppercase tracking-widest text-gray-900">Configuration</label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Category <span className="text-red-500">*</span></span>
                                        <div className="relative">
                                            <GeneralCategorySelect
                                                value={selectedCategory}
                                                onValueChange={handleCategoryChange}
                                                placeholder="Select Category"
                                                triggerClassName={`w-full h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all ${fieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-100"
                                                    }`}
                                                contentClassName="max-h-[400px]"
                                                error={fieldErrors.category}
                                            />
                                            {fieldErrors.category && (
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 mt-2 animate-in fade-in slide-in-from-top-1">{fieldErrors.category}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Language</span>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="h-12 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm">
                                                <SelectValue placeholder="English" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGE_OPTIONS.map((lang) => (
                                                    <SelectItem key={lang} value={lang}>
                                                        {lang}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                                </>
                            ) : (
                                <>
                                    {manualError && (
                                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                                            {manualError}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black text-xs">01</span>
                                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Title</label>
                                        </div>
                                        <Input
                                            placeholder="Article headline"
                                            value={manualTitle}
                                            onChange={(e) => {
                                                setManualTitle(e.target.value);
                                                if (manualFieldErrors.title) setManualFieldErrors(prev => ({ ...prev, title: undefined }));
                                            }}
                                            className={`h-14 rounded-2xl bg-gray-50 text-base font-medium focus-visible:ring-orange-500/20 transition-all ${manualFieldErrors.title ? "border-red-500 bg-red-50/30" : "border-gray-100"
                                                }`}
                                        />
                                        {manualFieldErrors.title && (
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">{manualFieldErrors.title}</p>
                                        )}
                                    </div>

                                    <ManualArticleImages
                                        imageFiles={manualImageFiles}
                                        onFilesAdded={handleManualImagesAdded}
                                        onRemove={removeManualImage}
                                    />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-black text-xs">03</span>
                                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Content</label>
                                        </div>
                                        <textarea
                                            placeholder="Write the full article body here..."
                                            value={manualContent}
                                            onChange={(e) => {
                                                setManualContent(e.target.value);
                                                if (manualFieldErrors.content) setManualFieldErrors(prev => ({ ...prev, content: undefined }));
                                            }}
                                            className={`w-full min-h-[240px] rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-y transition-all border ${manualFieldErrors.content ? "border-red-500 ring-red-500/10" : "border-gray-100"
                                                }`}
                                        />
                                        {manualFieldErrors.content && (
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">{manualFieldErrors.content}</p>
                                        )}
                                    </div>

                                    <div className="space-y-6 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-black text-xs">04</span>
                                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Configuration</label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Category <span className="text-red-500">*</span></span>
                                                <GeneralCategorySelect
                                                    value={manualCategory}
                                                    onValueChange={(val) => {
                                                        setManualCategory(val);
                                                        if (manualFieldErrors.category) setManualFieldErrors(prev => ({ ...prev, category: undefined }));
                                                    }}
                                                    placeholder="Select Category"
                                                    triggerClassName={`w-full h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all ${manualFieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-100"
                                                        }`}
                                                    contentClassName="max-h-[400px]"
                                                    error={manualFieldErrors.category}
                                                />
                                                {manualFieldErrors.category && (
                                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 mt-2 animate-in fade-in slide-in-from-top-1">{manualFieldErrors.category}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-orange-50 border border-orange-100 h-fit self-end">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                                                        <Layout className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">Headline</p>
                                                        <p className="text-[11px] text-gray-500">Feature on each site&apos;s hero</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setManualIsHeadline(!manualIsHeadline)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${manualIsHeadline ? "bg-orange-500" : "bg-gray-200"}`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${manualIsHeadline ? "translate-x-5" : "translate-x-0"}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-row items-center justify-between gap-4">
                            <div className="flex-1 flex justify-start">
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-6 h-12"
                                    disabled={isModalBusy}
                                >
                                    Discard
                                </Button>
                            </div>
                            {activeTab === "ai" ? (
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isModalBusy}
                                    className="flex-1 max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                                >
                                    {isModalBusy ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-5 h-5 fill-white" />
                                            <span>Generate</span>
                                        </div>
                                    )}
                                </Button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleManualCreate(false)}
                                        disabled={isModalBusy}
                                        className="h-14 rounded-2xl font-black px-6 border-gray-200"
                                    >
                                        {isSubmittingManual ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Draft
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => handleManualCreate(true)}
                                        disabled={isModalBusy}
                                        className="h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base px-6 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                                    >
                                        {isSubmittingManual ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Publishing...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Send className="w-4 h-4" />
                                                <span>Publish to All Sites</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
