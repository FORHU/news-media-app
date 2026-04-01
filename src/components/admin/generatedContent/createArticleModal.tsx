"use client";

import React from "react";
import { 
    Zap, 
    Link, 
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface CreateArticleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateArticleModal({
    open,
    onOpenChange,
}: CreateArticleModalProps) {
    const [topic, setTopic] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("");
    const [sourceUrl, setSourceUrl] = React.useState("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [isGenerating, setIsGenerating] = React.useState(false);

    // Fetch categories
    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => articlesApi.getCategories(),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = () => {
        // Logic will be added later
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 2000); // Simulate UI only
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className="w-4 h-4 text-orange-500" />;
        if (['pdf'].includes(ext || '')) return <File className="w-4 h-4 text-red-500" />;
        if (['txt'].includes(ext || '')) return <FileText className="w-4 h-4 text-blue-500" />;
        return <File className="w-4 h-4 text-gray-500" />;
    };

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
                            onChange={(e) => setTopic(e.target.value)}
                            className="h-14 rounded-2xl bg-gray-50 border-gray-100 text-base font-medium focus-visible:ring-orange-500/20 focus-visible:border-orange-200 transition-all"
                        />
                    </div>

                    {/* Step 2: Configuration */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black text-xs">02</span>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Configuration</label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category Selection */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</span>
                                <div className="relative">
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isLoadingCategories}>
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 border-gray-100 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {categories?.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* URL Upload */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Source URL</span>
                                <div className="relative">
                                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Paste a reference URL..."
                                        value={sourceUrl}
                                        onChange={(e) => setSourceUrl(e.target.value)}
                                        className="h-12 pl-10 rounded-xl bg-gray-50 border-gray-100 text-sm font-bold placeholder:text-gray-400 focus-visible:ring-orange-500/20 focus-visible:border-orange-200 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* File Upload Area */}
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
                    </div>
                </div>

                {/* Footer with Premium Button */}
                <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-row items-center justify-between gap-4">
                    <div className="flex-1 flex justify-start">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-6 h-12"
                        >
                            Discard
                        </Button>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex-1 max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                        {isGenerating ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating...</span>
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
