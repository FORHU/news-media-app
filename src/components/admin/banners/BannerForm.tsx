"use client";

import React from "react";
import { X, Upload, Loader2, Check, ExternalLink, Image as ImageIcon } from "lucide-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bannersApi } from "@/lib/api";
import { bannerSchema } from "@/lib/validation/banners";

interface BannerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: any; // If provided, we are editing
}

const POSITIONS = [
  { value: "HOME_TOP", label: "Homepage Top Banner" },
  { value: "HOME_SIDEBAR", label: "Homepage Sidebar" },
  { value: "ARTICLE_IN_FEED", label: "Article Mid-Content" },
  { value: "ARTICLE_SIDEBAR", label: "Article Sidebar" },
  { value: "GLOBAL_FOOTER", label: "Global Above-Footer" },
];

export default function BannerForm({ open, onOpenChange, banner }: BannerFormProps) {
  const [imageUrl, setImageUrl] = React.useState<string>(banner?.imageUrl || "");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [linkUrl, setLinkUrl] = React.useState<string>(banner?.linkUrl || "");
  const [altText, setAltText] = React.useState<string>(banner?.altText || "");
  const [position, setPosition] = React.useState<string>(banner?.position || "");
  const [isActive, setIsActive] = React.useState<boolean>(banner?.isActive ?? true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (open) {
      setImageUrl(banner?.imageUrl || "");
      setPreviewUrl(null);
      setLinkUrl(banner?.linkUrl || "");
      setAltText(banner?.altText || "");
      setPosition(banner?.position || "");
      setIsActive(banner?.isActive ?? true);
      setError(null);
      setFieldErrors({});
    }
    // Only cleanup previewUrls when component unmounts or modal closes
    return () => {
      // Note: We'll handle individual revocations inside handleImageUpload
    };
  }, [open, banner]);

  // Handle final cleanup of any leftover previewUrl on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (banner?.id) {
        return bannersApi.updateBanner(banner.id, data);
      }
      return bannersApi.createBanner(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to save banner.");
    },
  });

  const uploadBannerToSupabase = async (file: File): Promise<string> => {
    const { supabase } = await import("@/lib/supabaseClient");
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    // Using the 'articles' bucket which is confirmed to exist
    const { error: uploadError } = await supabase.storage
      .from("articles")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from("articles")
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous local object URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Instant Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);
    setError(null);

    try {
      const publicUrl = await uploadBannerToSupabase(file);
      setImageUrl(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = bannerSchema.safeParse({
      imageUrl,
      linkUrl,
      altText,
      position,
      isActive,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    mutation.mutate(result.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl">
        <div className="relative bg-gray-900 px-8 py-10">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all z-20 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>

          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ImageIcon className="w-7 h-7 text-white fill-white/20" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-white tracking-tight">
                {banner ? "Edit Banner" : "New Banner"}
              </DialogTitle>
              <DialogDescription className="text-gray-400 font-medium">
                {banner ? "Update your advertisement details." : "Create a new visual advertisement."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Position Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Position <span className="text-red-500">*</span></label>
              <Select value={position} onValueChange={(val) => {
                setPosition(val);
                setFieldErrors(prev => ({ ...prev, position: "" }));
              }}>
                <SelectTrigger className={`h-12 w-full rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 ${fieldErrors.position ? "border-red-500 bg-red-50/30" : "border-gray-100"}`}>
                  <SelectValue placeholder="Select placement position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value} className="font-medium">
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.position && (
                <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-wider">{fieldErrors.position}</p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Banner Image <span className="text-red-500">*</span></label>
              <div className="relative group">
                {(previewUrl || (imageUrl && imageUrl.trim() !== "")) ? (
                  <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-inner bg-gray-50 border border-gray-100">
                    <img 
                      src={previewUrl || imageUrl} 
                      alt={altText || "Banner Preview"} 
                      className="w-full h-full object-cover animate-in fade-in duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform">
                        Change Image
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-[21/9] rounded-2xl bg-[#7c7fff] transition-all cursor-pointer group relative overflow-hidden">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="text-xs font-black text-white/80 uppercase tracking-widest">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <span className="text-3xl font-black text-white tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">
                          BANNER PREVIEW
                        </span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                )}
                {fieldErrors.imageUrl && (
                  <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-wider">{fieldErrors.imageUrl}</p>
                )}
              </div>
            </div>

            {/* Destination Link */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Destination URL <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input
                  placeholder="https://example.com/promo"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    setFieldErrors(prev => ({ ...prev, linkUrl: "" }));
                  }}
                  className={`h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 pr-12 border-gray-100 shadow-sm transition-all ${fieldErrors.linkUrl ? "border-red-500 bg-red-50/30" : ""}`}
                />
                <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {fieldErrors.linkUrl && (
                <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-wider">{fieldErrors.linkUrl}</p>
              )}
            </div>

            {/* Alt Text */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Accessibility Text (Alt)</label>
              <Input
                placeholder="Brief description of the ad content"
                value={altText || ""}
                onChange={(e) => {
                  setAltText(e.target.value);
                  setFieldErrors(prev => ({ ...prev, altText: "" }));
                }}
                className={`h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 border-gray-100 shadow-sm transition-all ${fieldErrors.altText ? "border-red-500 bg-red-50/30" : ""}`}
              />
              {fieldErrors.altText && (
                <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-wider">{fieldErrors.altText}</p>
              )}
            </div>

            {/* Status Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? "bg-orange-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isActive ? "left-7" : "left-1"}`} />
              </button>
              <span className="text-sm font-bold text-gray-700">Banner is Active</span>
            </div>
          </div>
        </form>

        <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4">
          <div className="flex-1 flex justify-start">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-6 h-12"
            >
              Cancel
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || isUploading}
            className="flex-1 max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all px-8"
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            Save Banner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
