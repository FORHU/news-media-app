"use client";

import { Send, RefreshCw, Loader2, Eye, Clock } from "lucide-react";
import { ArticleThumbnail } from "./ArticleThumbnail";
import { StatusBadge } from "./StatusBadge";
import type { PublishableArticle, PublishOutcome } from "@/types/socialPublishing";
import type { SocialPlatformConfig } from "@/config/socialPlatforms";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function PublishableArticleRow({
  article,
  platform,
  selected,
  isPreviewing,
  outcome,
  isPublishing,
  isBulkPublishing,
  onToggleSelect,
  onTogglePreview,
  onPublishOrRetry,
}: {
  article: PublishableArticle;
  platform: SocialPlatformConfig;
  selected: boolean;
  isPreviewing: boolean;
  outcome?: PublishOutcome;
  isPublishing: boolean;
  isBulkPublishing: boolean;
  onToggleSelect: () => void;
  onTogglePreview: () => void;
  onPublishOrRetry: () => void;
}) {
  const Icon = platform.icon;

  return (
    <div
      className={`flex items-start gap-4 p-4 bg-white rounded-2xl border shadow-sm transition-all ${
        isPreviewing
          ? "border-blue-300 ring-1 ring-blue-300"
          : selected
            ? "border-orange-300 ring-1 ring-orange-300"
            : "border-gray-100 hover:border-gray-200"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
      />

      <ArticleThumbnail article={article} />

      <div className="flex-1 min-w-0 space-y-2">
        <button type="button" onClick={onTogglePreview} className="text-left">
          <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-1 hover:text-orange-600 transition-colors">
            {article.title}
          </p>
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={article.status} />
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <Clock className="w-2.5 h-2.5" />{formatDate(article.publishDate)}
          </span>
          {outcome && !outcome.success && (
            <span className="text-[10px] font-semibold text-red-500">{outcome.error}</span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={onTogglePreview}
          className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
        >
          <Eye className="w-3 h-3" />View
        </button>
        {article.postUrl && (
          <a
            href={article.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors ${platform.accentTextClass}`}
          >
            <Icon className="w-3 h-3" />Post
          </a>
        )}
        {article.status === "not_posted" && (
          <button
            onClick={onPublishOrRetry}
            disabled={isPublishing || isBulkPublishing}
            className={`flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-40 ${platform.accentButtonClass}`}
          >
            {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
        )}
        {article.status === "failed" && (
          <button
            onClick={onPublishOrRetry}
            disabled={isPublishing || isBulkPublishing}
            className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-40"
          >
            {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {isPublishing ? "Publishing…" : "Retry"}
          </button>
        )}
      </div>
    </div>
  );
}
