import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className="w-4 h-4 text-orange-500" />;
    if (['pdf'].includes(ext || '')) return <FileIcon className="w-4 h-4 text-red-500" />;
    if (['txt'].includes(ext || '')) return <FileText className="w-4 h-4 text-blue-500" />;
    return <FileIcon className="w-4 h-4 text-gray-500" />;
}

export function ManualArticleContext({
    topic,
    handleTopicChange,
    fieldErrors,
}: {
    topic: string;
    handleTopicChange: (val: string) => void;
    fieldErrors: { topic?: string };
}) {
    return (
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
    );
}

export function ManualMaterialsUpload({
    files,
    handleFileChange,
    removeFile,
}: {
    files: File[];
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: (index: number) => void;
}) {
    return (
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
    );
}
