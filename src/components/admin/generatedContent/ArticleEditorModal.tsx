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
    Layout,
    Globe,
    ExternalLink,
    Copy,
    Calendar,
    User,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { Article } from "@/lib/types";
import { format } from "date-fns";
import CategorySelectWithOther from "@/components/admin/shared/CategorySelectWithOther";
import { extractYoutubeId } from "@/lib/utils";
import TwitterStatusEmbed from "@/components/article/TwitterStatusEmbed";
import RegeneratePromptDialog, {
    type RegeneratePromptType,
} from "@/components/admin/generatedContent/RegeneratePromptDialog";
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

export interface ArticleEditorModalProps {
    article: Article | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ArticleEditorModal({
    article,
    open,
    onOpenChange,
}: ArticleEditorModalProps) {
    const queryClient = useQueryClient();

    const [displayArticle, setDisplayArticle] = React.useState<Article | null>(article);
    const [title, setTitle] = React.useState("");
    const [content, setContent] = React.useState("");
    const [categoryId, setCategoryId] = React.useState("");
    const [youtubeUrl, setYoutubeUrl] = React.useState("");
    const [isHeadline, setIsHeadline] = React.useState(false);
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [savedImageUrl, setSavedImageUrl] = React.useState<string | null>(null);
    const [imageMode, setImageMode] = React.useState<"upload" | "url">("upload");
    const [imageUrlInput, setImageUrlInput] = React.useState("");
    const [isUploadingImage, setIsUploadingImage] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
    const [regenerateError, setRegenerateError] = React.useState<string | null>(null);
    const [regeneratePromptType, setRegeneratePromptType] =
        React.useState<RegeneratePromptType | null>(null);
    const [copied, setCopied] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const syncFormFromArticle = React.useCallback((a: Article) => {
        setDisplayArticle(a);
        setTitle(a.title);
        setContent(a.content ?? "");
        setCategoryId(a.categoryId ?? a.category?.id ?? "");
        setYoutubeUrl(a.rawVideo?.youtubeUrl ?? a.youtubeUrl ?? "");
        setIsHeadline(a.isHeadline ?? false);
        setSavedImageUrl(a.imageUrl ?? a.rawArticle?.imageUrl ?? null);
        setImageFile(null);
        setImagePreview(null);
        setImageMode("upload");
        setImageUrlInput("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    React.useEffect(() => {
        // syncFormFromArticle mutates fileInputRef.current — refs can't be
        // touched during render, so this must stay a real effect.
        if (open && article) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            syncFormFromArticle(article);
            setError(null);
            setFieldErrors({});
            setSuccessMsg(null);
            setRegenerateError(null);
            setCopied(false);
        }
    }, [open, article, syncFormFromArticle]);

    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => articlesApi.getCategories(),
        enabled: open,
    });

    const isPublished = displayArticle?.status === "published";
    const publishDate = displayArticle?.publishDate || displayArticle?.createdAt;
    const authorName = displayArticle?.user
        ? `${displayArticle.user.firstName}`
        : "System";
    const originalUrl =
        displayArticle?.rawArticle?.crawledUrl?.url ||
        displayArticle?.rawVideo?.youtubeUrl ||
        displayArticle?.youtubeUrl;

    const isTweet = displayArticle?.sourceType === "TWEET";
    const tweetId = displayArticle?.rawTweet?.tweetId;
    const showTweetSidebar = isTweet && Boolean(tweetId);
    const youtubeId = extractYoutubeId(youtubeUrl);
    const currentImage =
        imageMode === "url" && imageUrlInput.trim()
            ? imageUrlInput.trim()
            : imagePreview ?? savedImageUrl;

    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (fieldErrors.imageUrl) setFieldErrors((prev) => ({ ...prev, imageUrl: "" }));

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setFieldErrors((prev) => ({
                ...prev,
                imageUrl: "Invalid file type. Please upload JPEG, PNG, or WebP.",
            }));
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setFieldErrors((prev) => ({
                ...prev,
                imageUrl: "File is too large. Maximum size is 5MB.",
            }));
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageUrlInput("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = "Headline is required";
        if (!content.trim()) newErrors.content = "Article content is required";
        if (!categoryId) newErrors.categoryId = "Please select a category";
        if (youtubeUrl.trim() && !youtubeId) {
            newErrors.youtubeUrl = "Please enter a valid YouTube or Shorts URL";
        }
        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveMutation = useMutation({
        mutationFn: async (publish: boolean) => {
            if (!displayArticle) throw new Error("No article selected");
            setError(null);
            setSuccessMsg(null);

            let finalImageUrl = savedImageUrl;
            if (imageMode === "url" && imageUrlInput.trim()) {
                finalImageUrl = imageUrlInput.trim();
            } else if (imageFile) {
                setIsUploadingImage(true);
                try {
                    finalImageUrl = await uploadImageToS3(imageFile);
                } finally {
                    setIsUploadingImage(false);
                }
            }

            return articlesApi.updateArticle(displayArticle.id, {
                title: title.trim(),
                content: content.trim(),
                categoryId,
                youtubeUrl: youtubeUrl.trim() || null,
                imageUrl: finalImageUrl || null,
                publish,
                isHeadline,
            });
        },
        onSuccess: (data, publish) => {
            const updated = data as Article;
            syncFormFromArticle(updated);
            queryClient.invalidateQueries({ queryKey: ["generatedArticles"] });
            if (publish) {
                onOpenChange(false);
            } else {
                setSuccessMsg(
                    isPublished ? "Published article updated." : "Draft saved."
                );
                setTimeout(() => setSuccessMsg(null), 5000);
            }
        },
        onError: (err: Error) => {
            setError(err.message || "Something went wrong.");
        },
    });

    const regenerateTextMutation = useMutation({
        mutationFn: (generationPrompt: string) => {
            if (!displayArticle) throw new Error("No article selected");
            return articlesApi.regenerateGeneratedArticle(
                displayArticle.id,
                "text",
                generationPrompt
            );
        },
        onSuccess: (updated) => {
            syncFormFromArticle(updated);
            setRegenerateError(null);
            setRegeneratePromptType(null);
            queryClient.invalidateQueries({ queryKey: ["generatedArticles"] });
        },
        onError: (err: Error) => {
            setRegenerateError(err.message || "Failed to regenerate text");
        },
    });

    const regenerateImageMutation = useMutation({
        mutationFn: (generationPrompt: string) => {
            if (!displayArticle) throw new Error("No article selected");
            return articlesApi.regenerateGeneratedArticle(
                displayArticle.id,
                "image",
                generationPrompt
            );
        },
        onSuccess: (updated) => {
            syncFormFromArticle(updated);
            setRegenerateError(null);
            setRegeneratePromptType(null);
            queryClient.invalidateQueries({ queryKey: ["generatedArticles"] });
        },
        onError: (err: Error) => {
            setRegenerateError(err.message || "Failed to regenerate image");
        },
    });

    const handleRegenerateConfirm = (prompt: string) => {
        if (regeneratePromptType === "text") regenerateTextMutation.mutate(prompt);
        else if (regeneratePromptType === "image") regenerateImageMutation.mutate(prompt);
    };

    const isRegenerating =
        regenerateTextMutation.isPending || regenerateImageMutation.isPending;
    const isBusy = saveMutation.isPending || isUploadingImage || isRegenerating;

    const handleSave = (publish: boolean) => {
        if (validate()) saveMutation.mutate(publish);
    };

    const handleCopy = () => {
        if (!content.trim()) return;
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!article || !displayArticle) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    showCloseButton={false}
                    className={`w-[min(96vw,1200px)] ${showTweetSidebar ? "sm:max-w-6xl" : "sm:max-w-5xl"} max-h-[92vh] h-[min(92vh,920px)] p-0 overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-gray-200/80 bg-white shadow-2xl flex flex-col`}
                >
                    {/* Header */}
                    <div className="relative flex-shrink-0 bg-gradient-to-br from-slate-900 via-gray-900 to-orange-950 px-6 sm:px-10 py-7 overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="absolute top-5 right-5 sm:top-7 sm:right-8 z-20 w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-white/20 hover:text-white transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 pr-12">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                        Review &amp; edit article
                                    </DialogTitle>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isPublished
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                                            : "bg-amber-500/20 text-amber-200 border border-amber-400/30"
                                            }`}
                                    >
                                        {isPublished ? "Published" : "Draft"}
                                    </span>
                                </div>
                                <DialogDescription className="text-gray-400 text-sm">
                                    Edit content, regenerate with AI, then save or publish.
                                </DialogDescription>
                                {publishDate ? (
                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(publishDate), "MMM d, yyyy")}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            {authorName}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="relative flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white">
                        {isBusy && (
                            <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-9 h-9 animate-spin text-orange-600" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
                                    {isRegenerating
                                        ? regenerateImageMutation.isPending
                                            ? "Regenerating image…"
                                            : "Regenerating text…"
                                        : isUploadingImage
                                          ? "Uploading image…"
                                          : saveMutation.isPending && saveMutation.variables
                                            ? "Publishing…"
                                            : "Saving…"}
                                </span>
                            </div>
                        )}

                        <div
                            className={`px-5 sm:px-10 py-7 flex flex-col ${showTweetSidebar ? "lg:flex-row" : ""} gap-8`}
                        >
                            <div
                                className={`flex-1 space-y-6 min-w-0 ${showTweetSidebar ? "lg:max-w-[720px]" : ""}`}
                            >
                                {successMsg ? (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold">
                                        <Check className="w-4 h-4 shrink-0" />
                                        {successMsg}
                                    </div>
                                ) : null}
                                {error ? (
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-bold">Error</p>
                                            <p className="text-xs mt-0.5 opacity-90">{error}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setError(null)}
                                            className="p-1 hover:bg-red-100 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : null}
                                {regenerateError ? (
                                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                                        {regenerateError}
                                    </div>
                                ) : null}

                                <div>
                                    <SectionLabel
                                        icon={<FileText className="w-4 h-4" />}
                                        label="Title"
                                    />
                                    <Input
                                        value={title}
                                        onChange={(e) => {
                                            setTitle(e.target.value);
                                            if (fieldErrors.title)
                                                setFieldErrors((p) => ({ ...p, title: "" }));
                                        }}
                                        className={`h-12 rounded-xl font-semibold ${fieldErrors.title ? "border-red-500" : ""}`}
                                    />
                                    {fieldErrors.title ? (
                                        <p className="mt-1.5 text-xs text-red-500 font-semibold">
                                            {fieldErrors.title}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <SectionLabel
                                        icon={<Tag className="w-4 h-4" />}
                                        label="Category"
                                    />
                                    <CategorySelectWithOther
                                        value={categoryId}
                                        onValueChange={(val) => {
                                            setCategoryId(val);
                                            if (fieldErrors.categoryId)
                                                setFieldErrors((p) => ({
                                                    ...p,
                                                    categoryId: "",
                                                }));
                                        }}
                                        categories={categories ?? []}
                                        isLoading={isLoadingCategories}
                                        triggerClassName={`h-12 w-full rounded-xl ${fieldErrors.categoryId ? "border-red-500" : ""}`}
                                        error={fieldErrors.categoryId}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl bg-orange-50 border border-orange-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
                                            <Layout className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">
                                                Headline spotlight
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                Feature on the site hero
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsHeadline(!isHeadline)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isHeadline ? "bg-orange-500" : "bg-gray-200"}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${isHeadline ? "translate-x-5" : "translate-x-0"}`}
                                        />
                                    </button>
                                </div>

                                <div>
                                    <SectionLabel
                                        icon={<FileText className="w-4 h-4" />}
                                        label="Article content"
                                    />
                                    <textarea
                                        value={content}
                                        onChange={(e) => {
                                            setContent(e.target.value);
                                            if (fieldErrors.content)
                                                setFieldErrors((p) => ({
                                                    ...p,
                                                    content: "",
                                                }));
                                        }}
                                        rows={12}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm leading-relaxed resize-y min-h-[240px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 ${fieldErrors.content ? "border-red-500" : "border-gray-200"}`}
                                    />
                                    {fieldErrors.content ? (
                                        <p className="mt-1.5 text-xs text-red-500 font-semibold">
                                            {fieldErrors.content}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <SectionLabel
                                        icon={<ImageIcon className="w-4 h-4" />}
                                        label="Featured image"
                                    />
                                    {/* Preview */}
                                    <div className="relative w-full min-h-[12rem] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 mb-3">
                                        {currentImage ? (
                                            // currentImage can be a FileReader data: URI (imagePreview) or an
                                            // arbitrary external URL (imageUrlInput) — next/image's optimizer
                                            // doesn't reliably handle both, plain img is the correct tool here.
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={currentImage}
                                                alt={title}
                                                className="w-full max-h-80 object-contain mx-auto"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                                                <ImageIcon className="w-10 h-10 opacity-30" />
                                                <span className="text-xs font-semibold">
                                                    No image
                                                </span>
                                            </div>
                                        )}
                                        {imagePreview ? (
                                            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase">
                                                New upload
                                            </div>
                                        ) : imageMode === "url" && imageUrlInput.trim() ? (
                                            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase">
                                                URL preview
                                            </div>
                                        ) : null}
                                        {/* Remove existing image */}
                                        {savedImageUrl && !imageFile && !(imageMode === "url" && imageUrlInput.trim()) ? (
                                            <button
                                                type="button"
                                                onClick={() => { setSavedImageUrl(null); clearImage(); }}
                                                className="absolute top-3 right-3 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
                                                title="Remove image"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        ) : null}
                                    </div>

                                    {/* Mode toggle */}
                                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-3 w-fit">
                                        <button
                                            type="button"
                                            onClick={() => { setImageMode("upload"); setImageUrlInput(""); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${imageMode === "upload" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                                        >
                                            <Upload className="w-3 h-3" />
                                            Upload file
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setImageMode("url"); clearImage(); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${imageMode === "url" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                                        >
                                            <Globe className="w-3 h-3" />
                                            Paste URL
                                        </button>
                                    </div>

                                    {imageMode === "upload" ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="rounded-xl font-bold"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                {currentImage ? "Replace image" : "Upload image"}
                                            </Button>
                                            {imageFile ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearImage}
                                                    className="text-red-600 rounded-xl font-bold"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Cancel
                                                </Button>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                value={imageUrlInput}
                                                onChange={(e) => setImageUrlInput(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="h-11 rounded-xl flex-1"
                                            />
                                            {imageUrlInput ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setImageUrlInput("")}
                                                    className="px-3 text-gray-400 hover:text-red-600 rounded-xl"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    )}

                                    {fieldErrors.imageUrl ? (
                                        <p className="mt-2 text-xs text-red-500 font-semibold">
                                            {fieldErrors.imageUrl}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3">
                                    <SectionLabel
                                        icon={<Youtube className="w-4 h-4" />}
                                        label="YouTube (optional)"
                                    />
                                    <Input
                                        value={youtubeUrl}
                                        onChange={(e) => {
                                            setYoutubeUrl(e.target.value);
                                            if (fieldErrors.youtubeUrl)
                                                setFieldErrors((p) => ({
                                                    ...p,
                                                    youtubeUrl: "",
                                                }));
                                        }}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className={`h-11 rounded-xl ${fieldErrors.youtubeUrl ? "border-red-500" : ""}`}
                                    />
                                    {youtubeId && !fieldErrors.youtubeUrl ? (
                                        <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-black">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                                title="YouTube preview"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full border-0"
                                            />
                                        </div>
                                    ) : null}
                                    {fieldErrors.youtubeUrl ? (
                                        <p className="text-xs text-red-500 font-semibold">
                                            {fieldErrors.youtubeUrl}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            {showTweetSidebar && tweetId ? (
                                <div className="lg:w-[380px] shrink-0 space-y-3">
                                    <SectionLabel
                                        icon={<Send className="w-4 h-4 -rotate-45" />}
                                        label="Original post"
                                    />
                                    <div className="sticky top-4">
                                        <TwitterStatusEmbed
                                            tweetId={tweetId}
                                            profileUrl={displayArticle.rawTweet?.profileUrl}
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                        <div className="px-5 sm:px-10 py-4 border-b border-gray-100 bg-gray-50/80">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
                                AI revision
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isBusy}
                                    onClick={() => setRegeneratePromptType("text")}
                                    className="h-11 rounded-xl font-bold border-indigo-200 bg-indigo-50/60 text-indigo-800 hover:bg-indigo-100"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Regenerate text
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isBusy}
                                    onClick={() => setRegeneratePromptType("image")}
                                    className="h-11 rounded-xl font-bold border-purple-200 bg-purple-50/60 text-purple-800 hover:bg-purple-100"
                                >
                                    <ImageIcon className="w-4 h-4 mr-2" />
                                    Regenerate image
                                </Button>
                            </div>
                        </div>

                        <div className="px-5 sm:px-10 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
                            <div className="flex flex-wrap gap-2 flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCopy}
                                    disabled={isBusy}
                                    className="h-11 rounded-xl font-bold"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 mr-2 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 mr-2" />
                                    )}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                                {originalUrl ? (
                                    <a
                                        href={originalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold text-sm border border-gray-200 bg-white hover:bg-gray-50"
                                    >
                                        <Globe className="w-4 h-4" />
                                        Source
                                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                    </a>
                                ) : null}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 lg:shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isBusy}
                                    className="h-11 rounded-xl font-bold text-gray-600"
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleSave(false)}
                                    disabled={isBusy}
                                    className="h-11 rounded-xl font-bold px-5"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                </Button>
                                {!isPublished ? (
                                    <Button
                                        type="button"
                                        onClick={() => handleSave(true)}
                                        disabled={isBusy}
                                        className="h-11 rounded-xl font-black px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Publish
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <RegeneratePromptDialog
                open={regeneratePromptType !== null}
                onOpenChange={(next) => {
                    if (!next && !isRegenerating) setRegeneratePromptType(null);
                }}
                type={regeneratePromptType ?? "text"}
                onConfirm={handleRegenerateConfirm}
                isPending={isRegenerating}
            />
        </>
    );
}
