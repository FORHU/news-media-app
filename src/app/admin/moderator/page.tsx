"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe2,
  CheckCircle,
  Ban,
  FileText,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Eye,
  X,
  Loader2,
} from "lucide-react";
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

type ArticlesResponse = {
  articles: ExternalArticle[];
  total: number;
  totalPages: number;
};

const STATUS_TABS = ["pending", "draft", "published", "rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const DOMAIN_FLAG: Record<string, string> = {
  "voicejeju.com": "🇰🇷",
  "jejutime.com": "🇺🇸",
  "jejuqq.com": "🇨🇳",
  "jejujapan.com": "🇯🇵",
};

const DOMAIN_LANG: Record<string, string> = {
  "voicejeju.com": "Korean",
  "jejutime.com": "English",
  "jejuqq.com": "Chinese",
  "jejujapan.com": "Japanese",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:
      "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-500/20",
    draft:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    published:
      "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20",
    rejected:
      "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20",
  };
  const dot: Record<string, string> = {
    pending: "bg-yellow-500",
    draft: "bg-blue-500",
    published: "bg-green-500",
    rejected: "bg-red-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${map[status] ?? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700"}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? "bg-gray-400"}`}
      />
      {status}
    </span>
  );
}

function groupArticles(articles: ExternalArticle[]): ArticleGroup[] {
  const groups = new Map<string, ExternalArticle[]>();
  for (const article of articles) {
    const date = article.publishDate
      ? new Date(article.publishDate)
      : new Date(article.createdAt);
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

async function fetchExternalArticles(
  status: string,
  page: number,
): Promise<ArticlesResponse> {
  const res = await fetch(
    `/api/admin/external/articles?status=${status}&page=${page}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function ModeratorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeTab = (searchParams.get("tab") as StatusTab) ?? "pending";

  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<ExternalArticle | null>(
    null,
  );
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewImgError, setPreviewImgError] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Reset pagination/error flags during render (not effects) — no extra
  // render pass, takes effect before this render paints.
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab);
    setPage(1);
  }
  const [prevPreviewId, setPrevPreviewId] = useState(previewId);
  if (previewId !== prevPreviewId) {
    setPrevPreviewId(previewId);
    setPreviewImgError(false);
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["external-submissions", activeTab, page],
    queryFn: () => fetchExternalArticles(activeTab, page),
    staleTime: 30_000,
  });

  const articles = data?.articles ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["external-submissions"] });
  }

  function onError(e: unknown, fallback: string) {
    setActionError(e instanceof Error ? e.message : fallback);
  }

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/external/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: [id] }),
      });
      if (!res.ok) throw new Error("Failed to approve.");
    },
    onSuccess: invalidateAll,
    onError: (e) => onError(e, "Approve failed."),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/external/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: [id] }),
      });
      if (!res.ok) throw new Error("Failed to publish.");
    },
    onSuccess: invalidateAll,
    onError: (e) => onError(e, "Publish failed."),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch("/api/admin/external/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: [id], reason }),
      });
      if (!res.ok) throw new Error("Failed to reject.");
    },
    onSuccess: () => {
      setConfirmRejectId(null);
      setRejectReason("");
      invalidateAll();
    },
    onError: (e) => onError(e, "Reject failed."),
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/external/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: [id] }),
      });
      if (!res.ok) throw new Error("Failed to unpublish.");
    },
    onSuccess: invalidateAll,
    onError: (e) => onError(e, "Unpublish failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/external/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id }),
      });
      if (!res.ok) throw new Error("Failed to delete.");
    },
    onSuccess: () => {
      setConfirmDeleteId(null);
      invalidateAll();
    },
    onError: (e) => onError(e, "Delete failed."),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      imageUrl,
    }: {
      id: string;
      title: string;
      content: string;
      imageUrl: string;
    }) => {
      const res = await fetch("/api/admin/external/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id, title, content, imageUrl }),
      });
      if (!res.ok) throw new Error("Failed to save.");
    },
    onSuccess: () => {
      setEditingArticle(null);
      invalidateAll();
    },
    onError: (e) =>
      setSaveError(e instanceof Error ? e.message : "Save failed."),
  });

  // Derive per-article loading IDs from mutation state
  const approvingId = approveMutation.isPending
    ? (approveMutation.variables ?? null)
    : null;
  const publishingId = publishMutation.isPending
    ? (publishMutation.variables ?? null)
    : null;
  const rejectingId = rejectMutation.isPending
    ? (rejectMutation.variables?.id ?? null)
    : null;
  const unpublishingId = unpublishMutation.isPending
    ? (unpublishMutation.variables ?? null)
    : null;
  const deletingId = deleteMutation.isPending
    ? (deleteMutation.variables ?? null)
    : null;

  function openEdit(article: ExternalArticle) {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditImageUrl(article.imageUrl ?? "");
    setSaveError(null);
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const previewArticle = previewId
    ? articles.find((a) => a.id === previewId)
    : null;
  const isGroupedTab = activeTab === "draft" || activeTab === "published";
  const articleGroups = isGroupedTab ? groupArticles(articles) : [];

  function ArticleActions({ article }: { article: ExternalArticle }) {
    const isConfirmingReject = confirmRejectId === article.id;
    const isConfirmingDelete = confirmDeleteId === article.id;

    // Reject confirm expands into a column — handle separately
    if (isConfirmingReject) {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (optional)"
            className="text-xs border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 rounded-xl px-3 py-1.5 w-44 focus:outline-none focus:border-orange-400"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => rejectMutation.mutate({ id: article.id, reason: rejectReason })}
              disabled={rejectingId === article.id}
              className="h-7 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {rejectingId === article.id ? "…" : "Confirm"}
            </button>
            <button
              onClick={() => { setConfirmRejectId(null); setRejectReason(""); }}
              className="h-7 px-3 rounded-xl bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {/* Status-specific actions */}
        {article.status === "pending" && (
          <>
            <button
              onClick={() => { setActionError(null); approveMutation.mutate(article.id); }}
              disabled={approvingId === article.id}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 border border-green-100 dark:border-green-500/20"
            >
              <CheckCircle className="w-3 h-3" />
              {approvingId === article.id ? "Generating…" : "Approve"}
            </button>
            <button
              onClick={() => { setConfirmRejectId(article.id); setActionError(null); }}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20"
            >
              <Ban className="w-3 h-3" />Reject
            </button>
          </>
        )}

        {article.status === "draft" && (
          <>
            <button
              onClick={() => openEdit(article)}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-500/20 transition-colors"
            >
              <Eye className="w-3 h-3" />View
            </button>
            {article.externalSubmission && (
              <button
                onClick={() => publishMutation.mutate(article.id)}
                disabled={publishingId === article.id}
                className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 text-white bg-orange-500 hover:bg-orange-600 border border-orange-400 shadow-sm shadow-orange-200/50 dark:shadow-orange-900/30"
              >
                <Send className="w-3 h-3" />
                {publishingId === article.id ? "Publishing…" : "Publish All"}
              </button>
            )}
          </>
        )}

        {article.status === "published" && (
          <>
            {article.slug && article.tenant && (
              <a
                href={`https://${article.tenant.domain}/article/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-500/20 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />View
              </a>
            )}
            <button
              onClick={() => unpublishMutation.mutate(article.id)}
              disabled={unpublishingId === article.id}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 transition-colors disabled:opacity-40"
            >
              <EyeOff className="w-3 h-3" />
              {unpublishingId === article.id ? "…" : "Unpublish"}
            </button>
          </>
        )}

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-0.5" />

        {/* Delete */}
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => deleteMutation.mutate(article.id)}
              disabled={deletingId === article.id}
              className="h-8 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {deletingId === article.id ? "…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="h-8 px-3 rounded-xl bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteId(article.id)}
            className="flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  function ArticleRow({
    article,
    compact = false,
    onRowClick,
    isExpanded,
    translationCount = 0,
  }: {
    article: ExternalArticle;
    compact?: boolean;
    onRowClick?: () => void;
    isExpanded?: boolean;
    translationCount?: number;
  }) {
    const domain = article.tenant?.domain ?? "";
    const flag = DOMAIN_FLAG[domain] ?? "🌐";
    const lang = DOMAIN_LANG[domain] ?? article.tenant?.siteName ?? domain;
    const isGroupHeader = onRowClick !== undefined;
    const [imgError, setImgError] = useState(false);

    return (
      <div
        className={`flex items-start gap-4 p-4 transition-colors ${
          isGroupHeader
            ? "border-l-4 border-orange-400 dark:border-orange-500 cursor-pointer hover:bg-orange-50/40 dark:hover:bg-orange-500/5"
            : ""
        }`}
        onClick={onRowClick}
      >
        <div
          className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-700 relative ${activeTab !== "draft" ? "cursor-pointer" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (activeTab !== "draft") setPreviewId(previewId === article.id ? null : article.id);
          }}
        >
          {article.imageUrl && !imgError ? (
            <Image
              src={`/api/admin/proxy-image?url=${encodeURIComponent(article.imageUrl)}`}
              alt={article.title}
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-orange-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p
            className={`text-sm font-bold text-gray-900 dark:text-zinc-100 leading-snug transition-colors ${activeTab !== "draft" ? "cursor-pointer hover:text-orange-600 dark:hover:text-orange-400" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (activeTab !== "draft") setPreviewId(previewId === article.id ? null : article.id);
            }}
          >
            {article.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {article.externalSubmission && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
                <Globe2 className="w-2.5 h-2.5" />
                {article.externalSubmission.sourcePlatform ?? "External"}
              </span>
            )}
            <StatusBadge status={article.status} />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-2 py-0.5 rounded-full">
              {article.category.categoryName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-2 py-0.5 rounded-full">
              {flag} {lang}
            </span>
            {translationCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                <Globe2 className="w-2.5 h-2.5" />
                {translationCount + 1} languages
              </span>
            )}
            {!compact && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                <Clock className="w-2.5 h-2.5" />
                {formatDate(article.createdAt)}
              </span>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <ArticleActions article={article} />
        </div>

        {isGroupHeader && (
          <div className="shrink-0 flex items-center self-stretch pl-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
              isExpanded
                ? "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
            }`}>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {isExpanded ? "Hide" : "Show"}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Globe2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
            External Submissions
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">
            Review and approve articles submitted by partner platforms
          </p>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => router.push(`/admin/moderator?tab=${tab}`)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
            {tab === "pending" && total > 0 && activeTab === "pending" && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-[9px]">
                {total}
              </span>
            )}
            {tab === "draft" && total > 0 && activeTab === "draft" && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[9px]">
                {total}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          className="ml-1 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition-all"
          title="Refresh"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Draft tab info banner */}
      {activeTab === "draft" && articles.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-sm text-blue-700 dark:text-blue-300">
          <CheckCircle className="w-4 h-4 shrink-0 text-blue-500" />
          <span>
            These articles have been translated and are ready for review. Click{" "}
            <strong>Publish All</strong> on a group to make them live across all
            4 sites.
          </span>
        </div>
      )}

      {/* Two-panel layout when previewing (not in draft tab) */}
      <div className={`${previewArticle && activeTab !== "draft" ? "grid grid-cols-2 gap-6" : ""}`}>
        {/* Article list */}
        <div
          className={`space-y-3 transition-opacity duration-200 ${!isLoading && isFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse"
              />
            ))
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 rounded-3xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                No {activeTab} submissions
              </p>
            </div>
          ) : isGroupedTab ? (
            articleGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.groupKey);
              const hasTranslations = group.translations.length > 0;
              return (
                <div
                  key={group.groupKey}
                  className={`bg-white dark:bg-zinc-800/60 rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    previewId === group.primary.id
                      ? "border-orange-300 dark:border-orange-500/50 ring-1 ring-orange-300 dark:ring-orange-500/50"
                      : "border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600"
                  }`}
                >
                  <ArticleRow
                    article={group.primary}
                    onRowClick={
                      hasTranslations
                        ? () => toggleGroup(group.groupKey)
                        : undefined
                    }
                    isExpanded={isExpanded}
                    translationCount={group.translations.length}
                  />
                  {isExpanded &&
                    group.translations.map((t) => (
                      <div
                        key={t.id}
                        className={`border-t border-gray-100 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-900/40 ${
                          previewId === t.id
                            ? "ring-1 ring-inset ring-orange-300 dark:ring-orange-500/40"
                            : ""
                        }`}
                      >
                        <ArticleRow article={t} compact />
                      </div>
                    ))}
                </div>
              );
            })
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                className={`bg-white dark:bg-zinc-800/60 rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  previewId === article.id
                    ? "border-orange-300 dark:border-orange-500/50 ring-1 ring-orange-300 dark:ring-orange-500/50"
                    : "border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600"
                }`}
              >
                <ArticleRow article={article} />
              </div>
            ))
          )}
        </div>

        {/* Content preview panel — hidden on draft tab (use View modal instead) */}
        {previewArticle && activeTab !== "draft" && (
          <div className="sticky top-8 h-fit bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
              <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate pr-4">
                {previewArticle.title}
              </p>
              <button
                onClick={() => setPreviewId(null)}
                className="shrink-0 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
            {previewArticle.imageUrl && !previewImgError ? (
              <div className="relative w-full h-40">
                <Image
                  src={`/api/admin/proxy-image?url=${encodeURIComponent(previewArticle.imageUrl)}`}
                  alt={previewArticle.title}
                  fill
                  sizes="400px"
                  className="object-cover"
                  onError={() => setPreviewImgError(true)}
                  unoptimized
                />
              </div>
            ) : previewArticle.imageUrl && previewImgError ? (
              <div className="w-full h-40 bg-gray-100 dark:bg-zinc-700 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-zinc-500">
                <FileText className="w-8 h-8 opacity-40" />
                <span className="text-[11px] font-semibold">
                  Image unavailable
                </span>
              </div>
            ) : null}
            <div
              className="px-5 py-4 prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto text-gray-700 dark:text-zinc-300 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: previewArticle.content }}
            />
            <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-700 space-y-1">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                External ID:{" "}
                <span className="text-gray-600 dark:text-zinc-300 font-mono">
                  {previewArticle.externalSubmission?.externalArticleId}
                </span>
              </p>
              {previewArticle.externalSubmission?.callbackUrl && (
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                  Callback:{" "}
                  <span className="text-gray-600 dark:text-zinc-300 font-mono break-all">
                    {previewArticle.externalSubmission.callbackUrl}
                  </span>
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

      {/* Edit modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-700 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                  Edit Article
                </span>
                {editingArticle.tenant && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-zinc-400">
                    {DOMAIN_FLAG[editingArticle.tenant.domain] ?? "🌐"}{" "}
                    {DOMAIN_LANG[editingArticle.tenant.domain] ??
                      editingArticle.tenant.siteName}
                  </span>
                )}
              </div>
              <button
                onClick={() => setEditingArticle(null)}
                className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editImageUrl && (
              <div className="shrink-0 relative group w-full h-52">
                <Image
                  src={`/api/admin/proxy-image?url=${encodeURIComponent(editImageUrl)}`}
                  alt={editingArticle.title}
                  fill
                  sizes="600px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Image URL field — changes apply to all 4 language articles */}
            <div className="px-6 pt-4 pb-0">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">
                  Image URL
                  <span className="ml-1.5 text-[9px] normal-case tracking-normal font-semibold text-orange-500 dark:text-orange-400">(updates all 4 languages)</span>
                </label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {saveError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {saveError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">
                  Content
                </label>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: editContent }}
                  onInput={(e) => setEditContent(e.currentTarget.innerHTML)}
                  className="min-h-[260px] w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm leading-relaxed focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors prose prose-sm dark:prose-invert max-w-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-zinc-700 shrink-0">
              <button
                onClick={() => setEditingArticle(null)}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateMutation.mutate({
                    id: editingArticle.id,
                    title: editTitle,
                    content: editContent,
                    imageUrl: editImageUrl,
                  })
                }
                disabled={
                  updateMutation.isPending ||
                  !editTitle.trim() ||
                  !editContent.trim()
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-colors"
              >
                {updateMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
