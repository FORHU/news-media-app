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
  { value: "ARTICLE_SIDEBAR", label: "Article Sidebar" },
  { value: "GLOBAL_FOOTER", label: "Global Above-Footer" },
  { value: "SIDEBAR_L_TOP", label: "Sidebar Left Top" },
  { value: "SIDEBAR_L_MID", label: "Sidebar Left Middle" },
  { value: "SIDEBAR_R_MID", label: "Sidebar Right Middle" },
  { value: "SIDEBAR_R_BTM", label: "Sidebar Right Bottom" },
  { value: "CONTENT_MID", label: "Main Content Middle" },
];

/** Helper to get YouTube ID for preview */
function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  let videoId = "";
  if (url.includes("v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("embed/")) {
    videoId = url.split("embed/")[1]?.split("?")[0];
  } else if (url.includes("shorts/")) {
    videoId = url.split("shorts/")[1]?.split("?")[0];
  } else if (url.includes("live/")) {
    videoId = url.split("live/")[1]?.split("?")[0];
  }
  return videoId || null;
}

export default function BannerForm({ open, onOpenChange, banner }: BannerFormProps) {
  const [name, setName] = React.useState<string>(banner?.name || "");
  const [banner_type, setBannerType] = React.useState<string>(banner?.banner_type || "IMAGE");
  const [imageUrl, setImageUrl] = React.useState<string>(banner?.imageUrl || "");
  const [youtubeUrl, setYoutubeUrl] = React.useState<string>(banner?.youtubeUrl || "");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [linkUrl, setLinkUrl] = React.useState<string>(banner?.linkUrl || "");
  const [altText, setAltText] = React.useState<string>(banner?.altText || "");
  const [positions, setPositions] = React.useState<string[]>(banner?.positions || []);
  const [isActive, setIsActive] = React.useState<boolean>(banner?.isActive ?? true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (open) {
      setName(banner?.name || "");
      setBannerType(banner?.banner_type || "IMAGE");
      setImageUrl(banner?.imageUrl || "");
      setYoutubeUrl(banner?.youtubeUrl || "");
      setPreviewUrl(null);
      setSelectedFile(null);
      setLinkUrl(banner?.linkUrl || "");
      setAltText(banner?.altText || "");
      setPositions(banner?.positions || []);
      setIsActive(banner?.isActive ?? true);
      setError(null);
      setFieldErrors({});
    }
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

  const uploadBannerToS3 = async (file: File): Promise<string> => {
    const res = await fetch("/api/admin/upload-image-presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { presignedUrl, publicUrl } = await res.json();
    const uploadRes = await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!uploadRes.ok) throw new Error("Failed to upload image");
    return publicUrl;
  };

  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setError(null);
    setFieldErrors(prev => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    let finalImageUrl = imageUrl;

    // Validate fields before initiating potentially slow upload
    const result = bannerSchema.safeParse({
      name,
      banner_type,
      imageUrl: banner_type === "IMAGE" && selectedFile ? "pending-upload" : (imageUrl || null),
      youtubeUrl: youtubeUrl || null,
      linkUrl: banner_type === "VIDEO" ? youtubeUrl : linkUrl,
      altText,
      positions,
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

    setIsUploading(true);

    try {
      if (banner_type === "IMAGE" && selectedFile) {
        finalImageUrl = await uploadBannerToS3(selectedFile);
        setImageUrl(finalImageUrl);
      }

      // Re-validate with actual URL
      const finalResult = bannerSchema.safeParse({
        name,
        banner_type,
        imageUrl: banner_type === "IMAGE" ? finalImageUrl : (imageUrl || null),
        youtubeUrl: youtubeUrl || null,
        linkUrl: banner_type === "VIDEO" ? youtubeUrl : linkUrl,
        altText,
        positions,
        isActive,
      });

      if (!finalResult.success) {
         setError("Validation failed after process.");
         return;
      }

      mutation.mutate(finalResult.data);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to save banner.");
    } finally {
      setIsUploading(false);
    }
  };

  const ytId = getYouTubeId(youtubeUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl">
        <div className="relative bg-gray-900 px-8 py-8">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all z-20 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>

          <div className="relative flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ImageIcon className="w-6 h-6 text-white fill-white/20" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-xl font-black text-white tracking-tight">
                {banner ? "Edit Banner" : "New Banner"}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm font-medium">
                {banner ? "Update your advertisement details." : "Create a new visual advertisement."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden max-h-[85vh]">
          <div className="px-8 py-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Type Selection */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Banner Type</label>
                <div className="flex gap-2">
                  {["IMAGE", "VIDEO"]
                    .filter((type) => banner ? banner.banner_type === type : true)
                    .map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        if (banner) return;
                        setBannerType(type);
                        setPositions([]);
                      }}
                      className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all border ${
                        banner_type === type 
                          ? "bg-gray-900 text-white border-gray-900 shadow-lg" 
                          : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                      } ${banner ? "cursor-default opacity-100" : ""}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5 md:col-span-2">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Banner Name <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="e.g. Summer Sale Campaign"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors(prev => ({ ...prev, name: "" }));
                    }}
                    className={`h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 border-gray-100 shadow-sm transition-all ${fieldErrors.name ? "border-red-500 bg-red-50/30" : ""}`}
                  />
                  {fieldErrors.name && (
                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-wider">{fieldErrors.name}</p>
                  )}
                </div>

                {banner_type === "IMAGE" ? (
                  /* Image Upload */
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
                            <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                              <Upload className="w-10 h-10 text-white/80 group-hover:text-white transition-colors group-hover:-translate-y-1 duration-300" />
                              <span className="text-2xl font-black text-white tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">
                                UPLOAD BANNER
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
                ) : (
                  /* YouTube Input */
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">YouTube URL <span className="text-red-500">*</span></label>
                    <div className="space-y-4">
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => {
                          setYoutubeUrl(e.target.value);
                          setFieldErrors(prev => ({ ...prev, youtubeUrl: "" }));
                        }}
                        className={`h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 border-gray-100 shadow-sm transition-all ${fieldErrors.youtubeUrl ? "border-red-500 bg-red-50/30" : ""}`}
                      />
                      {ytId ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black border border-gray-100">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            className="w-full h-full border-0"
                            allowFullScreen
                            title="Preview"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video rounded-2xl bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Video Preview</span>
                        </div>
                      )}
                    </div>
                    {fieldErrors.youtubeUrl && (
                      <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-wider">{fieldErrors.youtubeUrl}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Positions Multi-Select */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Positions <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.filter(pos => {
                    if (banner_type === "IMAGE") {
                      return !["SIDEBAR_L_TOP", "SIDEBAR_L_MID", "SIDEBAR_R_MID", "SIDEBAR_R_BTM", "CONTENT_MID"].includes(pos.value);
                    } else {
                      return !["HOME_TOP", "HOME_SIDEBAR", "ARTICLE_SIDEBAR", "GLOBAL_FOOTER"].includes(pos.value);
                    }
                  }).map((pos) => {
                    const isSelected = positions.includes(pos.value);
                    return (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() => {
                          setPositions(prev => 
                            isSelected 
                              ? prev.filter(p => p !== pos.value)
                              : [...prev, pos.value]
                          );
                          setFieldErrors(prev => ({ ...prev, positions: "" }));
                        }}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                          isSelected 
                            ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20" 
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.positions && (
                  <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-wider">{fieldErrors.positions}</p>
                )}
              </div>

              {/* Destination Link */}
              {banner_type === "IMAGE" && (
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
                      className={`h-12 rounded-xl bg-gray-50 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 pr-10 border-gray-100 shadow-sm transition-all ${fieldErrors.linkUrl ? "border-red-500 bg-red-50/30" : ""}`}
                    />
                    <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {fieldErrors.linkUrl && (
                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-wider">{fieldErrors.linkUrl}</p>
                  )}
                </div>
              )}

              {/* Alt Text */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Description / Alt Text</label>
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
              <div className="flex items-center gap-3 pt-2 md:col-span-2">
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
          </div>

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
        </form>
      </DialogContent>
    </Dialog>
  );
}
