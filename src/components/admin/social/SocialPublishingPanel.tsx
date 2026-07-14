"use client";

import { Send, RefreshCw, AlertCircle, FileText, Loader2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useSocialPublishing } from "@/hooks/admin/useSocialPublishing";
import { PublishableArticleRow } from "./PublishableArticleRow";
import { ArticlePreviewPanel } from "./ArticlePreviewPanel";
import type { SocialPlatformConfig } from "@/config/socialPlatforms";

export function SocialPublishingPanel({
  platform,
  apiBasePath,
}: {
  platform: SocialPlatformConfig;
  apiBasePath: string;
}) {
  const {
    articles, total, page, setPage, totalPages, loading, initialLoad, error,
    selected, toggleSelected, toggleSelectAll, allSelected,
    bulkPublishing, publishingId, lastOutcomes,
    previewId, setPreviewId, previewArticle,
    fetchArticles, handlePublishSelected, handlePublishOne,
  } = useSocialPublishing(apiBasePath, platform.key);

  return (
    <>
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm font-medium text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-gray-100 rounded-2xl p-3">
        <label className="flex items-center gap-2 pl-2 text-xs font-black uppercase tracking-widest text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            disabled={articles.length === 0}
            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
          />
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </label>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchArticles}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handlePublishSelected}
            disabled={selected.size === 0 || bulkPublishing}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 text-white shadow-sm ${platform.accentButtonClass}`}
          >
            {bulkPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {bulkPublishing ? "Publishing…" : `Publish to ${platform.label}${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </button>
        </div>
      </div>

      {/* Two-panel layout when previewing */}
      <div className={`${previewArticle ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}`}>
        {/* Article list */}
        <div className={`space-y-3 transition-opacity duration-200 ${loading && !initialLoad ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          {initialLoad && loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 rounded-3xl bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-400">No published articles yet</p>
            </div>
          ) : (
            articles.map((article) => (
              <PublishableArticleRow
                key={article.id}
                article={article}
                platform={platform}
                selected={selected.has(article.id)}
                isPreviewing={previewId === article.id}
                outcome={lastOutcomes.get(article.id)}
                isPublishing={publishingId === article.id}
                isBulkPublishing={bulkPublishing}
                onToggleSelect={() => toggleSelected(article.id)}
                onTogglePreview={() => setPreviewId(previewId === article.id ? null : article.id)}
                onPublishOrRetry={() => handlePublishOne(article.id)}
              />
            ))
          )}
        </div>

        {/* Content preview panel */}
        {previewArticle && (
          <ArticlePreviewPanel article={previewArticle} onClose={() => setPreviewId(null)} />
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemLabel="article" />
    </>
  );
}
