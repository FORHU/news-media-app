"use client";

import type { ArticleGenerationMode } from "@/lib/articleGenerationMode";

type Props = {
  value: ArticleGenerationMode;
  onChange: (mode: ArticleGenerationMode) => void;
  stepNumber?: string;
  /** e.g. “post” (X) or “video” (YouTube) — only for description nuance if needed */
  sourceLabel?: string;
  variant?: "default" | "youtube";
};

export default function ArticleGenerationModeSection({
  value,
  onChange,
  stepNumber = "02",
  variant = "default",
}: Props) {
  const isYoutube = variant === "youtube";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-black text-xs">
          {stepNumber}
        </span>
        <span className="text-sm font-black uppercase tracking-widest text-gray-900">
          Generation mode
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onChange("commentary")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange("commentary");
            }
          }}
          className={`cursor-pointer text-left rounded-2xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            value === "commentary"
              ? "border-amber-400 bg-amber-50/80 shadow-sm ring-2 ring-amber-200/60"
              : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
          }`}
        >
          <p className="text-sm font-black uppercase tracking-wide text-gray-900">
            Social Commentary
          </p>
          <p className="mt-1 text-sm font-medium text-gray-600 leading-snug">
            {isYoutube
              ? "The published page shows the YouTube player first, then your commentary. Use the prompt field for angle and emphasis."
              : "Includes an embedded reproduction of the post in the article. Use Custom Prompt for angle, stance, or emphasis."}
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onChange("standalone")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange("standalone");
            }
          }}
          className={`cursor-pointer text-left rounded-2xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            value === "standalone"
              ? "border-blue-400 bg-blue-50/50 shadow-sm ring-2 ring-blue-200/50"
              : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
          }`}
        >
          <p className="text-sm font-black uppercase tracking-wide text-gray-900">
            Independent Report
          </p>
          <p className="mt-1 text-sm font-medium text-gray-600 leading-snug">
            {isYoutube
              ? "Standard news-style article from the transcript. No embedded player above the story; cite the source only in the reference line."
              : "Full news article using the post as a primary source. No social-style embed block; reads like standard reporting."}
          </p>
        </div>
      </div>
    </div>
  );
}
