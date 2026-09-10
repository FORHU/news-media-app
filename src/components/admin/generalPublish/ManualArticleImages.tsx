"use client";

import React from "react";
import { X, ImageIcon, Plus } from "lucide-react";

/**
 * Multi-image attachment uploader for General Publish's manual-entry flow.
 * The first attached image is used as the featured image everywhere it's
 * displayed; the rest are stored alongside it (ContentArticle.imageUrls /
 * GeneralPublish.imageUrls) for future use.
 */
export function ManualArticleImages({
  imageFiles,
  onFilesAdded,
  onRemove,
}: {
  imageFiles: File[];
  onFilesAdded: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-black text-xs">
          02
        </span>
        <label className="text-sm font-black uppercase tracking-widest text-gray-900">Article Images</label>
        {imageFiles.length > 0 && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {imageFiles.length} attached
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {imageFiles.map((file, idx) => (
          <div
            key={`${file.name}-${file.lastModified}-${idx}`}
            className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 group bg-gray-50"
          >
            {/* createObjectURL produces a blob: URL — next/image's optimizer
                can't fetch blob: URLs, plain img is the correct tool here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={URL.createObjectURL(file)}
              alt={`Attachment ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                Featured
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <label className="relative aspect-video rounded-2xl border-2 border-dashed border-gray-200 hover:bg-orange-50/50 hover:border-orange-200 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer">
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
          {imageFiles.length === 0 ? (
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

      {imageFiles.length > 0 && (
        <p className="text-[11px] text-gray-400">
          The first image is used as the featured image everywhere the article is displayed.
        </p>
      )}
    </div>
  );
}
