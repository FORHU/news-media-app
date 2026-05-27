"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe2, CheckCircle, Ban, FileText, AlertCircle, RefreshCw, ExternalLink, Clock, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

type ExternalSubmission = {
  id: string;
  externalArticleId: string;
  sourcePlatform: string;
  callbackUrl: string | null;
  callbackStatus: string | null;
  callbackSentAt: string | null;
};

type ExternalArticle = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  imageUrl: string | null;
  content: string;
  createdAt: string;
  publishDate: string | null;
  tenant: { domain: string; siteName: string } | null;
  category: { id: string; categoryName: string };
  externalSubmission: ExternalSubmission | null;
};

type ArticleGroup = {
  groupKey: string;
  primary: ExternalArticle;
  translations: ExternalArticle[];
};

const STATUS_TABS = ["pending", "published", "rejected", "all"] as const;
type StatusTab = typeof STATUS_TABS[number];

const DOMAIN_FLAG: Record<string, string> = {
  "voicejeju.com":  "🇰🇷",
  "jejutime.com":   "🇺🇸",
  "jejuqq.com":     "🇨🇳",
  "jejujapan.com":  "🇯🇵",
};

const DOMAIN_LANG: Record<string, string> = {
  "voicejeju.com":  "Korean",
  "jejutime.com":   "English",
  "jejuqq.com":     "Chinese",
  "jejujapan.com":  "Japanese",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-600 border-yellow-100",
    published: "bg-green-50 text-green-600 border-green-100",
    rejected: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${map[status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "published" ? "bg-green-500" : status === "rejected" ? "bg-red-500" : "bg-yellow-500"}`} />
      {status}
    </span>
  );
}

function groupPublishedArticles(articles: ExternalArticle[]): ArticleGroup[] {
  const groups = new Map<string, ExternalArticle[]>();

  for (const article of articles) {
    const date = article.publishDate ? new Date(article.publishDate) : new Date(article.createdAt);
    // 10-second bucket so all 4 articles from one approval land in the same group
    const key = Math.floor(date.getTime() / 10000).toString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(article);
  }

  return Array.from(groups.entries())
    .map(([key, arts]) => {
      const primary =
        arts.find((a) => a.tenant?.domain?.includes("voicejeju.com")) ??
        arts.find((a) => a.externalSubmission !== null) ??
        arts[0];
      const translations = arts.filter((a) => a.id !== primary.id);
      return { groupKey: key, primary, translations };
    })
    .sort((a, b) => {
      const dateA = a.primary.publishDate ?? a.primary.createdAt;
      const dateB = b.primary.publishDate ?? b.primary.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

export default function ExternalSubmissionsPage() {
  const [articles, setArticles] = useState<ExternalArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewImgError, setPreviewImgError] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/external/articles?status=${activeTab}&page=${page}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setArticles(data.articles ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setError("Failed to load external submissions.");
      setArticles([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => { setPage(1); }, [activeTab]);
  useEffect(() => { setPreviewImgError(false); }, [previewId]);

  async function handleApprove(id: string) {
    setApprovingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/external/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: [id] }),
      });
      if (!res.ok) throw new Error("Failed to approve.");
      fetchArticles();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approve failed.");
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReject(id: string) {
    setRejectingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/external/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: [id], reason: rejectReason }),
      });
      if (!res.ok) throw new Error("Failed to reject.");
      setConfirmRejectId(null);
      setRejectReason("");
      fetchArticles();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reject failed.");
    } finally {
      setRejectingId(null);
    }
  }

  async function handleUnpublish(id: string) {
    setUnpublishingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/external/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: [id] }),
      });
      if (!res.ok) throw new Error("Failed to unpublish.");
      fetchArticles();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unpublish failed.");
    } finally {
      setUnpublishingId(null);
    }
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const previewArticle = previewId ? articles.find((a) => a.id === previewId) : null;
  const publishedGroups = activeTab === "published" ? groupPublishedArticles(articles) : [];

  function ArticleActions({ article }: { article: ExternalArticle }) {
    return (
      <div className="shrink-0 flex flex-col items-end gap-2">
        {article.status === "pending" && (
          <>
            {confirmRejectId === article.id ? (
              <div className="flex flex-col gap-2 items-end">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 w-48 focus:outline-none focus:border-orange-400"
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleReject(article.id)}
                    disabled={rejectingId === article.id}
                    className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {rejectingId === article.id ? "…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => { setConfirmRejectId(null); setRejectReason(""); }}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleApprove(article.id)}
                  disabled={approvingId === article.id}
                  className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 text-green-600 bg-green-50 hover:bg-green-100 border border-green-100"
                >
                  <CheckCircle className="w-3 h-3" />
                  {approvingId === article.id ? "…" : "Approve"}
                </button>
                <button
                  onClick={() => { setConfirmRejectId(article.id); setError(null); }}
                  className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors text-red-600 bg-red-50 hover:bg-red-100 border border-red-100"
                >
                  <Ban className="w-3 h-3" />Reject
                </button>
              </div>
            )}
          </>
        )}
        {article.status === "published" && (
          <div className="flex items-center gap-1">
            {article.slug && article.tenant && (
              <a
                href={`https://${article.tenant.domain}/article/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />View
              </a>
            )}
            <button
              onClick={() => handleUnpublish(article.id)}
              disabled={unpublishingId === article.id}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-40"
            >
              <EyeOff className="w-3 h-3" />
              {unpublishingId === article.id ? "…" : "Unpublish"}
            </button>
          </div>
        )}
      </div>
    );
  }

  function ArticleRow({
    article,
    compact = false,
    onRowClick,
    isExpanded,
    readOnly = false,
  }: {
    article: ExternalArticle;
    compact?: boolean;
    onRowClick?: () => void;
    isExpanded?: boolean;
    readOnly?: boolean;
  }) {
    const domain = article.tenant?.domain ?? "";
    const flag = DOMAIN_FLAG[domain] ?? "🌐";
    const lang = DOMAIN_LANG[domain] ?? article.tenant?.siteName ?? domain;

    return (
      <div
        className={`flex items-start gap-4 p-4 ${onRowClick ? "cursor-pointer" : ""}`}
        onClick={onRowClick}
      >
        <div
          className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
          onClick={() => setPreviewId(previewId === article.id ? null : article.id)}
        >
          {article.imageUrl
            ? <img src={`/api/admin/proxy-image?url=${encodeURIComponent(article.imageUrl)}`} alt={article.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Globe2 className="w-5 h-5 text-orange-400" /></div>}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p
            className="text-sm font-bold text-gray-900 leading-snug cursor-pointer hover:text-orange-600 transition-colors"
            onClick={() => setPreviewId(previewId === article.id ? null : article.id)}
          >
            {article.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {article.externalSubmission && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                <Globe2 className="w-2.5 h-2.5" />
                {article.externalSubmission.sourcePlatform ?? "External"}
              </span>
            )}
            <StatusBadge status={article.status} />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
              {article.category.categoryName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
              {flag} {lang}
            </span>
            {!compact && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                <Clock className="w-2.5 h-2.5" />{formatDate(article.createdAt)}
              </span>
            )}
          </div>
          {!compact && article.externalSubmission?.callbackStatus && (
            <p className="text-[10px] text-gray-400 font-medium">
              Webhook: <span className={article.externalSubmission.callbackStatus === "sent" ? "text-green-600" : "text-red-500"}>
                {article.externalSubmission.callbackStatus}
              </span>
              {article.externalSubmission.callbackSentAt && ` · ${formatDate(article.externalSubmission.callbackSentAt)}`}
            </p>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <ArticleActions article={article} />
          </div>
        )}
        {onRowClick !== undefined && (
          <div className="shrink-0 flex items-center self-stretch pl-1 text-gray-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">External Submissions</h1>
            <p className="text-gray-500 text-sm font-medium">Review and approve articles submitted by partner platforms</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm font-medium text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {tab === "pending" && total > 0 && activeTab === "pending" && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-[9px]">{total}</span>
            )}
          </button>
        ))}
        <button
          onClick={fetchArticles}
          className="ml-1 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition-all"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Two-panel layout when previewing */}
      <div className={`${previewArticle ? "grid grid-cols-2 gap-6" : ""}`}>

        {/* Article list */}
        <div className={`space-y-3 transition-opacity duration-200 ${loading && !initialLoad ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          {initialLoad && loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 rounded-3xl bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-400">
                No {activeTab === "all" ? "" : activeTab} submissions
              </p>
            </div>
          ) : activeTab === "published" ? (
            /* Grouped view for Published tab */
            publishedGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.groupKey);
              const hasTranslations = group.translations.length > 0;

              return (
                <div
                  key={group.groupKey}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    previewId === group.primary.id ? "border-orange-300 ring-1 ring-orange-300" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {/* Primary row — clicking the row toggles translations */}
                  <ArticleRow
                    article={group.primary}
                    onRowClick={hasTranslations ? () => toggleGroup(group.groupKey) : undefined}
                    isExpanded={isExpanded}
                  />

                  {/* Translation sub-rows */}
                  {isExpanded && group.translations.map((t) => (
                    <div
                      key={t.id}
                      className={`border-t border-gray-100 bg-gray-50/60 ${
                        previewId === t.id ? "ring-1 ring-inset ring-orange-300" : ""
                      }`}
                    >
                      <ArticleRow article={t} compact readOnly />
                    </div>
                  ))}
                </div>
              );
            })
          ) : (
            /* Flat view for Pending / Rejected / All tabs */
            articles.map((article) => (
              <div
                key={article.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  previewId === article.id ? "border-orange-300 ring-1 ring-orange-300" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <ArticleRow article={article} />
              </div>
            ))
          )}
        </div>

        {/* Content preview panel */}
        {previewArticle && (
          <div className="sticky top-8 h-fit bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900 truncate pr-4">{previewArticle.title}</p>
              <button
                onClick={() => setPreviewId(null)}
                className="shrink-0 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
            {previewArticle.imageUrl && !previewImgError ? (
              <img
                src={`/api/admin/proxy-image?url=${encodeURIComponent(previewArticle.imageUrl)}`}
                alt={previewArticle.title}
                className="w-full h-40 object-cover"
                onError={() => setPreviewImgError(true)}
              />
            ) : previewArticle.imageUrl && previewImgError ? (
              <div className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400">
                <FileText className="w-8 h-8 opacity-40" />
                <span className="text-[11px] font-semibold">Image unavailable</span>
              </div>
            ) : null}
            <div
              className="px-5 py-4 prose prose-sm max-w-none max-h-[60vh] overflow-y-auto text-gray-700 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: previewArticle.content }}
            />
            <div className="px-5 py-3 border-t border-gray-100 space-y-1">
              <p className="text-[10px] text-gray-400 font-medium">
                External ID: <span className="text-gray-600 font-mono">{previewArticle.externalSubmission?.externalArticleId}</span>
              </p>
              {previewArticle.externalSubmission?.callbackUrl && (
                <p className="text-[10px] text-gray-400 font-medium">
                  Callback: <span className="text-gray-600 font-mono break-all">{previewArticle.externalSubmission.callbackUrl}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        itemLabel="submission"
      />
    </div>
  );
}
