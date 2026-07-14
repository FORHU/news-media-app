"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublishableArticle, PublishOutcome } from "@/types/socialPublishing";

// Each platform's list route names its status/URL fields after itself
// (facebookStatus/facebookPostUrl, instagramStatus/instagramPostUrl) rather
// than a shared generic name — normalize() maps whichever one applies onto
// the generic PublishableArticle shape so the UI layer never has to know
// which platform's API it's talking to.
type RawArticle = Omit<PublishableArticle, "status" | "postUrl"> & Record<string, unknown>;

function normalize(raw: RawArticle, platformKey: string): PublishableArticle {
  return {
    ...raw,
    status: raw[`${platformKey}Status`] as PublishableArticle["status"],
    postUrl: (raw[`${platformKey}PostUrl`] as PublishableArticle["postUrl"]) ?? null,
  };
}

export function useSocialPublishing(apiBasePath: string, platformKey: string) {
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
      const res = await fetch(`${apiBasePath}/articles?page=${page}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setArticles(((data.articles ?? []) as RawArticle[]).map((raw) => normalize(raw, platformKey)));
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      setError("Failed to load published articles.");
      setArticles([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [apiBasePath, page, platformKey]);

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

  async function publish(articleIds: string[]) {
    const res = await fetch(`${apiBasePath}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleIds }),
    });
    if (!res.ok) throw new Error("Failed to publish.");
    const data: { results: PublishOutcome[] } = await res.json();
    setLastOutcomes((prev) => {
      const next = new Map(prev);
      for (const outcome of data.results) next.set(outcome.articleId, outcome);
      return next;
    });
    fetchArticles();
  }

  async function handlePublishSelected() {
    if (selected.size === 0) return;
    setBulkPublishing(true);
    setError(null);
    try {
      await publish(Array.from(selected));
      setSelected(new Set());
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
      await publish([id]);
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

  return {
    articles,
    total,
    page,
    setPage,
    totalPages,
    loading,
    initialLoad,
    error,
    selected,
    toggleSelected,
    toggleSelectAll,
    allSelected,
    bulkPublishing,
    publishingId,
    lastOutcomes,
    previewId,
    setPreviewId,
    previewArticle,
    fetchArticles,
    handlePublishSelected,
    handlePublishOne,
  };
}
