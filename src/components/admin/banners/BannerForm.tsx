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
import { bannersApi, articlesApi } from "@/lib/api";
import Image from "next/image";

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
  const [imageUrl, setImageUrl] = React.useState(banner?.imageUrl || "");
  const [linkUrl, setLinkUrl] = React.useState(banner?.linkUrl || "");
  const [altText, setAltText] = React.useState(banner?.altText || "");
  const [position, setPosition] = React.useState(banner?.position || "");
  const [isActive, setIsActive] = React.useState(banner?.isActive ?? true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (open) {
      setImageUrl(banner?.imageUrl || "");
      setLinkUrl(banner?.linkUrl || "");
      setAltText(banner?.altText || "");
      setPosition(banner?.position || "");
      setIsActive(banner?.isActive ?? true);
      setError(null);
    }
  }, [open, banner]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const { url, key, fileUrl } = await articlesApi.getUploadUrl(file.name, file.type);
      
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      setImageUrl(fileUrl || key);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !linkUrl || !position) {
      setError("Please fill in all required fields.");
      return;
    }

    mutation.mutate({
      imageUrl,
      linkUrl,
      altText,
      position,
      isActive,
    });
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff4500] to-[#ff6b35] flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ImageIcon className="w-7 h-7 text-white" />
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
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="h-12 w-full rounded-xl bg-gray-50 border-gray-100 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20">
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
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Banner Image <span className="text-red-500">*</span></label>
              <div className="relative group">
                {imageUrl ? (
                  <div className="relative aspect-[3/1] rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200">
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform">
                        Change Image
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-[3/1] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 group-hover:text-orange-500 transition-colors mb-2" />
                        <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600">Click to upload banner</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
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
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-12 rounded-xl bg-gray-50 border-gray-100 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20"
                />
                <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>

            {/* Alt Text */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Accessibility Text (Alt)</label>
              <Input
                placeholder="Brief description of the ad content"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 border-gray-100 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20"
              />
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

        <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-6 h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || isUploading}
            className="rounded-2xl bg-gradient-to-r from-[#ff4500] to-[#ff6b35] text-white font-black text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all px-8 h-12"
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
