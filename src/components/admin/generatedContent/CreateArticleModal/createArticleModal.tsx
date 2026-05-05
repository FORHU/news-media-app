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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LANGUAGE_OPTIONS, 
    ManualArticleContext, 
    ManualMaterialsUpload, 
    ManualArticleImage 
} from "./ManualGenerationTab";
import CategorySelectWithOther from "@/components/admin/shared/CategorySelectWithOther";

interface CreateArticleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateArticleModal({
    open,
    onOpenChange,
}: CreateArticleModalProps) {
    const [topic, setTopic] = React.useState("");
    const [language, setLanguage] = React.useState("English");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [pastedText, setPastedText] = React.useState("");
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<{
        category?: string;
        topic?: string;
        materials?: string;
    }>({});
    const [isProcessingFiles, setIsProcessingFiles] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);

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

    const onPastedTextChange = (val: string) => {
        setPastedText(val);
        setFieldErrors(prev => ({ ...prev, materials: undefined }));
    };

    const handleMaterialsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e);
        setFieldErrors(prev => ({ ...prev, materials: undefined }));
    };

    // Fetch categories
    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => articlesApi.getCategories(),
    });

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || "");
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
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
            // Only allow .txt and .pdf for materials
            const validFiles = incomingFiles.filter(f => 
                f.name.endsWith('.txt') || f.type === 'application/pdf'
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

        // 1. Validate Category (Universal)
        if (!selectedCategory) {
            newErrors.category = "Please select a category";
        }

        // 2. Manual Validation
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

        setIsProcessingFiles(true);
        try {
            const texts = await Promise.all(textFiles.map(readFileAsText));
            const allTexts = texts.join("\n\n---\n\n");
            
            if (allTexts) {
                combinedFileContent = combinedFileContent 
                    ? `${combinedFileContent}\n\n[FILE ATTACHMENTS]\n${allTexts}` 
                    : allTexts;
            }

            if (imageFile) {
                uploadedImageUrl = await readFileAsBase64(imageFile);
            }

            await articlesApi.createArticleFromUpload({
                categoryId: selectedCategory,
                topic,
                extractedText: combinedFileContent,
                s3ImageUrl: uploadedImageUrl,
                language,
                prompt: buildLanguageDirective(language),
            });

            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
            onOpenChange(false);
        } catch (err: any) {
            console.error("Manual Generation Error:", err);
            setError(err.message || "Failed to process local files.");
            setIsProcessingFiles(false);
        }
    };

    const isModalBusy = isProcessingFiles;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[840px] p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl"
            >
                {isModalBusy ? (
                    <div className="relative min-h-[500px] flex flex-col items-center justify-center gap-6 px-10 py-16 bg-gradient-to-b from-white to-orange-50/40 overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-50">
                            <div className="absolute -top-20 -left-12 w-48 h-48 rounded-full bg-orange-100 blur-3xl" />
                            <div className="absolute -bottom-20 -right-12 w-52 h-52 rounded-full bg-orange-200/60 blur-3xl" />
                        </div>

                        <div className="relative w-20 h-20 rounded-3xl bg-white border border-orange-100 shadow-lg flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        </div>

                        <div className="relative text-center space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Crafting Your Article</h3>
                            <p className="text-sm font-medium text-gray-600 max-w-md">
                                We are analyzing your input and generating a polished draft. This can take up to a few seconds.
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
                                <div className="px-3 py-2 rounded-lg bg-white/90 border border-orange-100 text-center">Uploading</div>
                                <div className="px-3 py-2 rounded-lg bg-white/90 border border-orange-100 text-center">Analyzing</div>
                                <div className="px-3 py-2 rounded-lg bg-white/90 border border-orange-100 text-center">Generating</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
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

                        <div className="px-8 py-8 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
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

                            {/* Step 2: Configuration - Shared */}
                            <div className="space-y-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-black text-xs">04</span>
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
                        </div>

                        {/* Footer with Premium Button */}
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
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

