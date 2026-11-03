"use client";

import React from "react";
import { X, Loader2, Save, Send, Layout, Rss, ImageIcon, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import type { GeneralPublishBroadcast } from "@/lib/types";
import GeneralCategorySelect from "@/components/admin/generalPublish/GeneralCategorySelect";
import StrayNotesNotice from "@/components/admin/generalPublish/StrayNotesNotice";
import { toast } from "@/components/ui/toaster";
import { detectStrayNotes, strayNotesMessage } from "@/lib/generalPublishRules";

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

/** One attached image: already saved (url) or newly picked (file). */
type EditorImage = { key: string; url?: string; file?: File; preview: string };

let imageKeyCounter = 0;
const nextImageKey = () => `img-${++imageKeyCounter}`;

export interface GeneralPublishEditorModalProps {
    broadcast: GeneralPublishBroadcast | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function GeneralPublishEditorModal({
    broadcast,
    open,
    onOpenChange,
}: GeneralPublishEditorModalProps) {
    const queryClient = useQueryClient();

    const [title, setTitle] = React.useState("");
    const [content, setContent] = React.useState("");
    const [category, setCategory] = React.useState("");
    const [isHeadline, setIsHeadline] = React.useState(false);
    const [images, setImages] = React.useState<EditorImage[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = React.useState(false);

    const syncFormFromBroadcast = React.useCallback((b: GeneralPublishBroadcast) => {
        setTitle(b.title);
        setContent(b.content ?? "");
        setCategory(b.category);
        setIsHeadline(b.isHeadline ?? false);
        // Older broadcasts may only have imageUrl; newer ones carry the full list.
        const saved = b.imageUrls?.length ? b.imageUrls : b.imageUrl ? [b.imageUrl] : [];
        setImages(saved.map((url) => ({ key: nextImageKey(), url, preview: url })));
        setError(null);
        setFieldErrors({});
    }, []);

    const [prevKey, setPrevKey] = React.useState<string | null>(null);
    const key = open && broadcast ? broadcast.id : null;
    if (key !== prevKey) {
        setPrevKey(key);
        if (key && broadcast) syncFormFromBroadcast(broadcast);
    }

    const handleImagesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length === 0) return;
        setImages((prev) => [
            ...prev,
            ...files.map((file) => ({ key: nextImageKey(), file, preview: URL.createObjectURL(file) })),
        ]);
    };

    const removeImage = (key: string) => {
        setImages((prev) => {
            const removed = prev.find((i) => i.key === key);
            if (removed?.file) URL.revokeObjectURL(removed.preview);
            return prev.filter((i) => i.key !== key);
        });
    };

    const makeFeatured = (key: string) => {
        setImages((prev) => {
            const picked = prev.find((i) => i.key === key);
            return picked ? [picked, ...prev.filter((i) => i.key !== key)] : prev;
        });
    };

    const handleSave = async (publish?: boolean) => {
        if (!broadcast) return;
        setError(null);
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = "Title is required";
        if (!content.trim()) newErrors.content = "Content is required";
        if (!category.trim()) newErrors.category = "Category is required";

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        // Same rule the server enforces — fail fast with the fix in view.
        if (publish === true) {
            const notes = detectStrayNotes(content);
            if (notes.found.length > 0) {
                setError(strayNotesMessage(notes.found));
                return;
            }
        }

        setIsSaving(true);
        try {
            // Upload new files, keeping the on-screen order (first = featured).
            const imageUrls = await Promise.all(
                images.map((img) => (img.file ? uploadImageToS3(img.file) : Promise.resolve(img.url as string)))
            );

            await articlesApi.updateGeneralPublish(broadcast.id, {
                title: title.trim(),
                content: content.trim(),
                category: category.trim(),
                imageUrls,
                isHeadline,
                ...(publish !== undefined ? { publish } : {}),
            });

            queryClient.invalidateQueries({ queryKey: ['generalPublishes'] });
            queryClient.invalidateQueries({ queryKey: ['generalPublishAudit'] });
            onOpenChange(false);
            toast({
                variant: 'success',
                title:
                    publish === true ? 'Saved and published to all sites'
                    : publish === false ? 'Saved and unpublished from all sites'
                    : 'Changes saved to all sites',
            });
        } catch (err: unknown) {
            console.error("General Publish Editor Error:", err);
            setError(err instanceof Error ? err.message : "Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!broadcast) return null;

    const isPublished = broadcast.publishedCount > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[840px] p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl"
            >
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
                                Edit Broadcast
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium">
                                Changes apply to all {broadcast.targets.length} sites this was published to.
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

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-900">Title</label>
                        <Input
                            placeholder="Article headline"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: "" }));
                            }}
                            className={`h-14 rounded-2xl bg-gray-50 text-base font-medium focus-visible:ring-orange-500/20 transition-all ${fieldErrors.title ? "border-red-500 bg-red-50/30" : "border-gray-100"}`}
                        />
                        {fieldErrors.title && (
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">{fieldErrors.title}</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Images</label>
                            {images.length > 0 && (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {images.length} attached
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {images.map((img, idx) => (
                                <div
                                    key={img.key}
                                    className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 group bg-gray-50"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img.preview} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                                    {idx === 0 ? (
                                        <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                                            Featured
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => makeFeatured(img.key)}
                                            className="absolute bottom-1.5 left-1.5 bg-black/60 hover:bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            Make featured
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img.key)}
                                        aria-label={`Remove image ${idx + 1}`}
                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}

                            <label className="relative aspect-video rounded-2xl border-2 border-dashed border-gray-200 hover:bg-orange-50/50 hover:border-orange-200 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesAdded} />
                                {images.length === 0 ? (
                                    <>
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-900 text-center px-2">Upload Images</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Add More</span>
                                    </>
                                )}
                            </label>
                        </div>
                        {images.length > 0 && (
                            <p className="text-[11px] text-gray-400">
                                The first image is the headline image. The others appear inside the article body while reading.
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-900">Content</label>
                        <textarea
                            placeholder="Write the full article body here..."
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value);
                                if (fieldErrors.content) setFieldErrors(prev => ({ ...prev, content: "" }));
                            }}
                            className={`w-full min-h-[240px] rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-y transition-all border ${fieldErrors.content ? "border-red-500 ring-red-500/10" : "border-gray-100"}`}
                        />
                        {fieldErrors.content && (
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">{fieldErrors.content}</p>
                        )}
                        <StrayNotesNotice content={content} onClean={setContent} />
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-900">Configuration</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Category <span className="text-red-500">*</span></span>
                                <GeneralCategorySelect
                                    value={category}
                                    onValueChange={(val) => {
                                        setCategory(val);
                                        if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: "" }));
                                    }}
                                    placeholder="Select Category"
                                    triggerClassName={`w-full h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all ${fieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-100"}`}
                                    contentClassName="max-h-[400px]"
                                    error={fieldErrors.category}
                                />
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
                                    onClick={() => setIsHeadline(!isHeadline)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isHeadline ? "bg-orange-500" : "bg-gray-200"}`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${isHeadline ? "translate-x-5" : "translate-x-0"}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-row items-center justify-between gap-4">
                    <div className="flex-1 flex justify-start">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-6 h-12"
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSave()}
                            disabled={isSaving}
                            className="h-14 rounded-2xl font-black px-6 border-gray-200"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => handleSave(!isPublished)}
                            disabled={isSaving}
                            className="h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base px-6 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                        >
                            {isSaving ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    <span>{isPublished ? "Save & Unpublish All" : "Save & Publish to All"}</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
