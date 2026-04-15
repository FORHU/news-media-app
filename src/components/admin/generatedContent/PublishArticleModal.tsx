"use client";

import React from "react";
import {
    X,
    Send,
    Loader2,
    ImageIcon,
    Youtube,
    Tag,
    FileText,
    Save,
    Upload,
    Trash2,
    AlertCircle,
    Check,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
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
    SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { Article } from "@/lib/types";
import { CATEGORY_HIERARCHY } from "@/lib/categories";
import { StoryImage } from "@/components/StoryImage";

// ─── helpers ────────────────────────────────────────────────────────────────

function extractYoutubeId(url: string): string | null {
    if (!url.trim()) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

async function uploadImageToSupabase(file: File): Promise<string> {
    const { supabase } = await import("@/lib/supabaseClient");
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `article-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("articles").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
    });
    if (error) throw new Error(error.message);
    const {
        data: { publicUrl },
    } = supabase.storage.from("articles").getPublicUrl(path);
    return publicUrl;
}

// ─── Section label ───────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <span className="text-orange-500">{icon}</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                {label}
            </span>
        </div>
    );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PublishArticleModalProps {
    article: Article;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PublishArticleModal({
    article,
    open,
    onOpenChange,
}: PublishArticleModalProps) {
    const queryClient = useQueryClient();

    // ── form state ──
    const [title, setTitle] = React.useState(article.title);
    const [content, setContent] = React.useState(article.content ?? "");
    const [categoryId, setCategoryId] = React.useState(
        article.categoryId ?? article.category?.id ?? ""
    );
    const [youtubeUrl, setYoutubeUrl] = React.useState(
        (article as any).youtubeUrl ?? ""
    );
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // reset when article or open changes
    React.useEffect(() => {
        if (open) {
            setTitle(article.title);
            setContent(article.content ?? "");
            setCategoryId(article.categoryId ?? (article.category as any)?.id ?? "");
            setYoutubeUrl((article as any).youtubeUrl ?? "");
            setImageFile(null);
            setImagePreview(null);
            setError(null);
            setFieldErrors({});
            setSuccessMsg(null);
        }
    }, [open, article]);

    // ── categories ──
    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => articlesApi.getCategories(),
    });

    const groupedCategories = CATEGORY_HIERARCHY.map((group) => ({
        label: group.label,
        items:
            categories?.filter((cat) =>
                group.subcategories.some(
                    (sub) => sub.toLowerCase() === cat.name.toLowerCase()
                )
            ) ?? [],
    })).filter((g) => g.items.length > 0);

    // ── image pick ──
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset previous image-related errors
        if (fieldErrors.imageUrl) setFieldErrors(prev => ({ ...prev, imageUrl: "" }));

        // Validate type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setFieldErrors(prev => ({ 
                ...prev, 
                imageUrl: "Invalid file type. Please upload a JPEG, PNG, or WebP image." 
            }));
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // Validate size
        if (file.size > MAX_FILE_SIZE) {
            setFieldErrors(prev => ({ 
                ...prev, 
                imageUrl: "File is too large. Maximum size allowed is 5MB." 
            }));
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onprogress = () => setIsUploadingImage(true);
        reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
            setIsUploadingImage(false);
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── youtube preview ──
    const youtubeId = extractYoutubeId(youtubeUrl);

    // ── validation ──
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = "Headline is required";
        if (!content.trim()) newErrors.content = "Article content is required";
        if (!categoryId) newErrors.categoryId = "Please select a category";
        
        if (youtubeUrl.trim() && !youtubeId) {
            newErrors.youtubeUrl = "Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)";
        }

        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── mutation ──
    const mutation = useMutation({
        mutationFn: async (publish: boolean) => {
            setError(null);
            setSuccessMsg(null);

            let finalImageUrl: string | null | undefined = undefined;
            if (imageFile) {
                setIsUploadingImage(true);
                try {
                    finalImageUrl = await uploadImageToSupabase(imageFile);
                } catch (err: any) {
                    throw new Error(`Image upload failed: ${err.message}`);
                } finally {
                    setIsUploadingImage(false);
                }
            } else if (imagePreview === null) {
                // User explicitly removed the image
                finalImageUrl = null;
            }

            return articlesApi.updateArticle(article.id, {
                title: title.trim(),
                content: content.trim(),
                categoryId,
                youtubeUrl: youtubeUrl.trim() || null,
                imageUrl: finalImageUrl,
                publish,
            });
        },
        onSuccess: (_data, publish) => {
            queryClient.invalidateQueries({ queryKey: ["generatedArticles"] });
            if (publish) {
                onOpenChange(false);
            } else {
                setSuccessMsg("Changes saved successfully.");
                // clear success message after 5 seconds
                setTimeout(() => setSuccessMsg(null), 5000);
            }
        },
        onError: (err: any) => {
            setError(err.message || "Something went wrong.");
        },
    });

    const handleFormSubmit = (publish: boolean) => {
        if (validate()) {
            mutation.mutate(publish);
        }
    };

    const isBusy = mutation.isPending || isUploadingImage;
    const currentImage = imagePreview ?? article.imageUrl;

    // ── view ──
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="w-[95vw] sm:max-w-[780px] max-h-[92vh] p-0 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-none bg-white shadow-2xl flex flex-col"
            >
                {/* ── header ── */}
                <div className="relative bg-gray-900 px-6 sm:px-8 py-7 overflow-hidden flex-shrink-0">
                    {/* decorative glow */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 blur-[80px] -mr-36 -mt-36 pointer-events-none" />

                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-5 right-5 sm:top-7 sm:right-7 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 transition-all z-20"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                            <Send className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight line-clamp-1 pr-10">
                                Review &amp; Publish
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 text-sm font-medium mt-0.5">
                                Edit fields, add a YouTube video, then publish.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* ── scrollable body ── */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 py-6 space-y-6 bg-gray-50/40">

                    {/* success banner */}
                    {successMsg && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
                            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {successMsg}
                        </div>
                    )}

                    {/* error banner */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold">Execution Failed</p>
                                <p className="text-xs opacity-80 mt-0.5">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* ── TITLE ── */}
                    <div>
                        <SectionLabel icon={<FileText className="w-4 h-4" />} label="Title" />
                        <Input
                            id="publish-modal-title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: "" }));
                            }}
                            placeholder="Article headline..."
                            className={`h-12 rounded-xl bg-white border-gray-200 text-gray-900 font-semibold text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-300 shadow-sm ${
                                fieldErrors.title ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/10" : ""
                            }`}
                        />
                        {fieldErrors.title && (
                            <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors.title}
                            </p>
                        )}
                    </div>

                    {/* ── CATEGORY ── */}
                    <div>
                        <SectionLabel icon={<Tag className="w-4 h-4" />} label="Category" />
                        <Select
                            value={categoryId}
                            onValueChange={(val) => {
                                setCategoryId(val);
                                if (fieldErrors.categoryId) setFieldErrors(prev => ({ ...prev, categoryId: "" }));
                            }}
                            disabled={isLoadingCategories}
                        >
                            <SelectTrigger
                                id="publish-modal-category"
                                className={`h-12 w-full rounded-xl bg-white border-gray-200 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm ${
                                    fieldErrors.categoryId ? "border-red-500 focus-visible:ring-red-500/10" : ""
                                }`}
                            >
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[380px]">
                                {groupedCategories.map((group) => (
                                    <SelectGroup key={group.label}>
                                        <SelectLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 px-4 py-2 mt-1 border-b border-gray-50">
                                            {group.label}
                                        </SelectLabel>
                                        {group.items.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id}
                                                className="pl-6 font-semibold"
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldErrors.categoryId && (
                            <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors.categoryId}
                            </p>
                        )}
                    </div>

                    {/* ── CONTENT ── */}
                    <div>
                        <SectionLabel
                            icon={<FileText className="w-4 h-4" />}
                            label="Article Content"
                        />
                        <textarea
                            id="publish-modal-content"
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value);
                                if (fieldErrors.content) setFieldErrors(prev => ({ ...prev, content: "" }));
                            }}
                            rows={10}
                            placeholder="Edit article content here..."
                            className={`w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 font-medium leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 shadow-sm transition-all placeholder:text-gray-400 ${
                                fieldErrors.content ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : ""
                            }`}
                        />
                        {fieldErrors.content && (
                            <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors.content}
                            </p>
                        )}
                    </div>

                    {/* ── MAIN IMAGE (Optional) ── */}
                    <div>
                        <SectionLabel
                            icon={<ImageIcon className="w-4 h-4" />}
                            label="Main Image (Optional)"
                        />

                        {/* current / preview */}
                        <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm mb-3">
                            {currentImage ? (
                                <>
                                    <StoryImage
                                        src={currentImage}
                                        alt="Article image"
                                        fill
                                        sizes="700px"
                                        className="object-cover"
                                    />
                                    {imagePreview && (
                                        <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow">
                                            New Upload
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                    <ImageIcon className="w-10 h-10 opacity-30" />
                                    <span className="text-xs font-semibold">No image set</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                ref={fileInputRef}
                                id="publish-modal-image-upload"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 rounded-xl font-bold text-sm border-gray-200 hover:bg-gray-50 shadow-sm h-10"
                            >
                                <Upload className="w-4 h-4 text-orange-500" />
                                {imageFile ? "Replace Image" : "Upload New Image"}
                            </Button>
                            {imageFile && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={clearImage}
                                    className="flex items-center gap-2 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 h-10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                </Button>
                            )}
                            <span className="text-xs text-gray-400 font-medium">
                                {imageFile
                                    ? imageFile.name
                                    : article.imageUrl
                                    ? "Using current image"
                                    : "No image — default will be used"}
                            </span>
                        </div>
                        {fieldErrors.imageUrl && (
                            <p className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors.imageUrl}
                            </p>
                        )}
                    </div>

                    {/* ── YOUTUBE URL (Optional) ── */}
                    <div className="space-y-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                <Youtube className="w-4 h-4 text-red-600" />
                            </div>
                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                                YouTube Video (Optional)
                            </label>
                        </div>

                        <div className="relative group">
                            <Input
                                value={youtubeUrl}
                                onChange={(e) => {
                                    setYoutubeUrl(e.target.value);
                                    if (fieldErrors.youtubeUrl) {
                                        setFieldErrors((prev) => ({ ...prev, youtubeUrl: "" }));
                                    }
                                }}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className={`h-12 bg-gray-50 border-gray-100 rounded-xl pl-4 pr-10 text-sm font-semibold focus-visible:ring-red-500/20 transition-all ${
                                    fieldErrors.youtubeUrl ? "border-red-500 bg-red-50/30" : ""
                                }`}
                            />
                            <Youtube className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${youtubeId ? 'text-red-500' : 'text-gray-300'}`} />
                        </div>

                        {/* live embed preview */}
                        {youtubeId && !fieldErrors.youtubeUrl && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-black aspect-video animate-in zoom-in-95 duration-300">
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeId}`}
                                    title="YouTube preview"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>
                        )}

                        {fieldErrors.youtubeUrl && (
                            <p className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors.youtubeUrl}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── footer ── */}
                <div className="flex-shrink-0 px-5 sm:px-8 py-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    {/* discard */}
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isBusy}
                        className="sm:mr-auto rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 h-12 px-6"
                    >
                        Discard
                    </Button>

                    {/* save without publishing */}
                    <Button
                        variant="outline"
                        onClick={() => handleFormSubmit(false)}
                        disabled={isBusy}
                        className="flex items-center gap-2 rounded-xl font-bold h-12 px-6 border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
                    >
                        {isBusy && !mutation.variables ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 text-gray-500" />
                        )}
                        Save Changes
                    </Button>

                    {/* publish */}
                    <Button
                        onClick={() => handleFormSubmit(true)}
                        disabled={isBusy}
                        className="flex items-center gap-2 rounded-xl font-black h-12 px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all"
                    >
                        {isBusy && mutation.variables ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {isUploadingImage
                            ? "Uploading..."
                            : mutation.isPending && mutation.variables
                            ? "Publishing..."
                            : "Publish Article"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
