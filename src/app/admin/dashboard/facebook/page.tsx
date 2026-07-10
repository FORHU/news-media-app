"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Facebook, CheckCircle2, XCircle, Send, RefreshCw, AlertCircle, ExternalLink, Clock, FileText, Loader2, Eye, X, ImageOff } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

type FacebookStatus = "not_posted" | "published" | "failed";

type PublishableArticle = {
  id: string;
  title: string;
  slug: string | null;
  imageUrl: string | null;
  content: string;
  publishDate: string | null;
  tenantDomain: string;
  facebookStatus: FacebookStatus;
  facebookPostUrl: string | null;
};

type PublishOutcome = {
  articleId: string;
  success: boolean;
  postUrl?: string;
  error?: string;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: FacebookStatus }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-green-50 text-green-600 border-green-100">
        <CheckCircle2 className="w-2.5 h-2.5" />Published
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-red-50 text-red-600 border-red-100">
        <XCircle className="w-2.5 h-2.5" />Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-gray-100 text-gray-500 border-gray-200">
      Not Posted
    </span>
  );
}

function ArticleThumbnail({ article }: { article: PublishableArticle }) {
  const [imgError, setImgError] = useState(false);

  if (!article.imageUrl || imgError) {
    return (
      <div className="shrink-0 w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
        <ImageOff className="w-5 h-5 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
      <Image
        src={`/api/admin/proxy-image?url=${encodeURIComponent(article.imageUrl)}`}
        alt={article.title}
        fill
        sizes="56px"
        className="object-cover"
        unoptimized
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function FacebookPublishingPage() {
  const [articles, setArticles] = useState<PublishableArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [lastOutcomes, setLastOutcomes] = useState<Map<string, PublishOutcome>>(new Map());
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/facebook/articles?page=${page}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setArticles(data.articles ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      setError("Failed to load published articles.");
      setArticles([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page]);

  // Standard fetch-on-dependency-change pattern; fetchArticles sets loading
  // state synchronously before its first await.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === articles.length ? new Set() : new Set(articles.map((a) => a.id))));
  }

  async function handlePublishSelected() {
    if (selected.size === 0) return;
    setBulkPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/facebook/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Failed to publish to Facebook.");
      const data: { results: PublishOutcome[] } = await res.json();

      const outcomes = new Map<string, PublishOutcome>();
      for (const outcome of data.results) outcomes.set(outcome.articleId, outcome);
      setLastOutcomes(outcomes);
      setSelected(new Set());
      fetchArticles();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setBulkPublishing(false);
    }
  }

  // Used for both the first-time "Publish" action on a not-yet-posted article
  // and "Retry" on a failed one — same call, different button/label per state.
  async function handlePublishOne(id: string) {
    setPublishingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/facebook/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: [id] }),
      });
      if (!res.ok) throw new Error("Failed to publish to Facebook.");
      const data: { results: PublishOutcome[] } = await res.json();
      setLastOutcomes((prev) => {
        const next = new Map(prev);
        for (const outcome of data.results) next.set(outcome.articleId, outcome);
        return next;
      });
      fetchArticles();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setPublishingId(null);
    }
  }

  const allSelected = articles.length > 0 && selected.size === articles.length;
  const previewArticle = previewId ? articles.find((a) => a.id === previewId) ?? null : null;

  // Closing the previewed article (e.g. it drops off the page after a refetch)
  // shouldn't leave a stale panel open.
  const [prevArticlesRef, setPrevArticlesRef] = useState(articles);
  if (articles !== prevArticlesRef) {
    setPrevArticlesRef(articles);
    if (previewId && !articles.some((a) => a.id === previewId)) setPreviewId(null);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1877F2] to-[#0c5dc7] flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Facebook className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Facebook Publishing</h1>
          <p className="text-gray-500 text-sm font-medium">Select published articles to post to the company Facebook Page</p>
        </div>
      </div>

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
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 text-white bg-[#1877F2] hover:bg-[#0c5dc7] shadow-sm shadow-blue-200/50"
          >
            {bulkPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {bulkPublishing ? "Publishing…" : `Publish to Facebook${selected.size > 0 ? ` (${selected.size})` : ""}`}
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
            articles.map((article) => {
              const outcome = lastOutcomes.get(article.id);
              return (
                <div
                  key={article.id}
                  className={`flex items-start gap-4 p-4 bg-white rounded-2xl border shadow-sm transition-all ${
                    previewId === article.id
                      ? "border-blue-300 ring-1 ring-blue-300"
                      : selected.has(article.id)
                        ? "border-orange-300 ring-1 ring-orange-300"
                        : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(article.id)}
                    onChange={() => toggleSelected(article.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                  />

                  <ArticleThumbnail article={article} />

                  <div className="flex-1 min-w-0 space-y-2">
                    <button
                      type="button"
                      onClick={() => setPreviewId(previewId === article.id ? null : article.id)}
                      className="text-left"
                    >
                      <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-1 hover:text-orange-600 transition-colors">
                        {article.title}
                      </p>
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={article.facebookStatus} />
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
                      onClick={() => setPreviewId(previewId === article.id ? null : article.id)}
                      className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
                    >
                      <Eye className="w-3 h-3" />View
                    </button>
                    {article.facebookPostUrl && (
                      <a
                        href={article.facebookPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1877F2] bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
                      >
                        <Facebook className="w-3 h-3" />Post
                      </a>
                    )}
                    {article.facebookStatus === "not_posted" && (
                      <button
                        onClick={() => handlePublishOne(article.id)}
                        disabled={publishingId === article.id || bulkPublishing}
                        className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-[#1877F2] hover:bg-[#0c5dc7] transition-colors disabled:opacity-40"
                      >
                        {publishingId === article.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {publishingId === article.id ? "Publishing…" : "Publish"}
                      </button>
                    )}
                    {article.facebookStatus === "failed" && (
                      <button
                        onClick={() => handlePublishOne(article.id)}
                        disabled={publishingId === article.id || bulkPublishing}
                        className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-40"
                      >
                        {publishingId === article.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        {publishingId === article.id ? "Publishing…" : "Retry"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Content preview panel */}
        {previewArticle && (
          <div className="sticky top-8 h-fit bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900 truncate pr-4">{previewArticle.title}</p>
              <div className="shrink-0 flex items-center gap-3">
                {previewArticle.slug && (
                  <a
                    href={`https://${previewArticle.tenantDomain}/article/${previewArticle.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />Live Site
                  </a>
                )}
                <button
                  onClick={() => setPreviewId(null)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {previewArticle.imageUrl && (
              <div className="relative w-full h-48 bg-gray-100">
                <Image
                  src={`/api/admin/proxy-image?url=${encodeURIComponent(previewArticle.imageUrl)}`}
                  alt={previewArticle.title}
                  fill
                  sizes="600px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div
              className="px-5 py-4 prose prose-sm max-w-none max-h-[50vh] overflow-y-auto text-gray-700 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: previewArticle.content }}
            />
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemLabel="article" />
    </div>
  );
}
