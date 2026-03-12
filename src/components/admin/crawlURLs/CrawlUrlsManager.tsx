"use client";

import React from "react";
import {
  CirclePlay,
  ClipboardPaste,
  Link as LinkIcon,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type UrlStatus = "Queued" | "Invalid";

type QueuedUrl = {
  id: string;
  url: string;
  domain: string;
  status: UrlStatus;
  addedAt: number;
};

function normalizeUrl(raw: string): { url: string; domain: string; valid: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: "", domain: "", valid: false };

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname) return { url: trimmed, domain: "", valid: false };
    return { url: u.toString(), domain: u.hostname, valid: true };
  } catch {
    return { url: trimmed, domain: "", valid: false };
  }
}

function splitBulk(input: string): string[] {
  return input
    .split(/[\n,\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getValidUrlsForSend(rawUrls: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of rawUrls) {
    const parsed = normalizeUrl(raw);
    if (!parsed.valid) continue;
    const key = parsed.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(parsed.url);
  }
  return out;
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateInput(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CrawlUrlsManager() {
  const [singleUrl, setSingleUrl] = React.useState("");
  const [bulk, setBulk] = React.useState("");
  const [queue, setQueue] = React.useState<QueuedUrl[]>([]);
  const [lastAction, setLastAction] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateInput(d);
  });
  const [endDate, setEndDate] = React.useState(() => formatDateInput(new Date()));
  const [maxRequestsPerCrawl, setMaxRequestsPerCrawl] = React.useState<number>(10);

  const queuedCount = queue.filter((q) => q.status === "Queued").length;
  const invalidCount = queue.filter((q) => q.status === "Invalid").length;
  const bulkValidCount = React.useMemo(() => {
    const items = splitBulk(bulk);
    return getValidUrlsForSend(items).length;
  }, [bulk]);

  const addUrls = React.useCallback((urls: string[]) => {
    if (urls.length === 0) return;

    setQueue((prev) => {
      const existing = new Set(prev.map((p) => p.url.toLowerCase()));
      const next: QueuedUrl[] = [];

      for (const raw of urls) {
        const parsed = normalizeUrl(raw);
        if (!parsed.url) continue;
        const key = parsed.url.toLowerCase();
        if (existing.has(key)) continue;
        existing.add(key);

        next.push({
          id: makeId(),
          url: parsed.url,
          domain: parsed.domain,
          status: parsed.valid ? "Queued" : "Invalid",
          addedAt: Date.now(),
        });
      }

      if (next.length > 0) {
        setLastAction(`Added ${next.length} URL${next.length === 1 ? "" : "s"} to queue`);
      }
      return [...next, ...prev];
    });
  }, []);

  const onAddSingle = React.useCallback(() => {
    const value = singleUrl.trim();
    if (!value) return;
    addUrls([value]);
    setSingleUrl("");
  }, [addUrls, singleUrl]);

  const onAddBulk = React.useCallback(() => {
    const items = splitBulk(bulk);
    addUrls(items);
    setBulk("");
  }, [addUrls, bulk]);

  const remove = React.useCallback((id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const clearInvalid = React.useCallback(() => {
    setQueue((prev) => prev.filter((q) => q.status !== "Invalid"));
    setLastAction("Cleared invalid URLs");
  }, []);

  const clearAll = React.useCallback(() => {
    setQueue([]);
    setLastAction("Cleared queue");
  }, []);

  const startCrawl = React.useCallback(async () => {
    if (starting) return;
    const queuedUrls = queue.filter((q) => q.status === "Queued").map((q) => q.url);
    const bulkUrls = queuedUrls.length === 0 ? getValidUrlsForSend(splitBulk(bulk)) : [];
    const urls = queuedUrls.length > 0 ? queuedUrls : bulkUrls;
    if (urls.length === 0) {
      setError("Add at least one valid URL to start crawling.");
      return;
    }

    setStarting(true);
    setError(null);
    try {
      if (queuedUrls.length === 0 && bulkUrls.length > 0) {
        addUrls(splitBulk(bulk));
        setBulk("");
      }

      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls,
          start_date: startDate,
          end_date: endDate,
          max_requests_per_crawl: maxRequestsPerCrawl,
        }),
      });

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const data = (await res.json()) as any;
          if (typeof data?.error === "string") message = data.error;
          else if (typeof data?.message === "string") message = data.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      setLastAction(
        `Crawl started for ${urls.length} URL${urls.length === 1 ? "" : "s"} (${startDate} → ${endDate}, max ${maxRequestsPerCrawl})`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start crawl");
    } finally {
      setStarting(false);
    }
  }, [addUrls, bulk, endDate, maxRequestsPerCrawl, queue, startDate, starting]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Crawl URLs</h1>
        <p className="text-gray-500 font-medium">
          Add one or more URLs, then start a crawl run.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Add URL(s)
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">Queue URLs to crawl</p>
              <p className="mt-1 text-xs text-gray-500 font-medium">
                Paste multiple URLs (new line / comma / space separated). Duplicates are ignored.
              </p>
            </div>

            {lastAction && (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs font-semibold text-gray-500">{lastAction}</span>
                <button
                  onClick={() => setLastAction(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
              {error}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://example.com/news"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
            <button
              onClick={onAddSingle}
              className="md:col-span-4 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!singleUrl.trim()}
            >
              <Plus className="w-5 h-5" />
              Add URL
            </button>

            <div className="md:col-span-8">
              <div className="relative">
                <ClipboardPaste className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                <textarea
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                  placeholder={"Paste multiple URLs here...\nexample.com/page-1\nhttps://site.com/a, https://site.com/b"}
                  rows={5}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
            <button
              onClick={onAddBulk}
              className="md:col-span-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#ff4500] to-[#ff6b35] text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={splitBulk(bulk).length === 0}
            >
              <Plus className="w-5 h-5" />
              Add Bulk
            </button>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Run settings</p>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <label className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Start date
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  End date
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Max requests
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={Number.isFinite(maxRequestsPerCrawl) ? maxRequestsPerCrawl : 10}
                  onChange={(e) => setMaxRequestsPerCrawl(Math.max(1, Number(e.target.value || 1)))}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </label>
            </div>

            <div className="pt-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Queue</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Ready</span>
              <span className="text-sm font-extrabold text-gray-900">{queuedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">Invalid</span>
              <span className="text-sm font-extrabold text-gray-500">{invalidCount}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <button
                onClick={startCrawl}
                disabled={(queuedCount === 0 && bulkValidCount === 0) || starting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CirclePlay className="w-5 h-5" />
                {starting ? "Starting..." : "Start Crawl"}
              </button>
              <button
                onClick={clearInvalid}
                disabled={invalidCount === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-900 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5 text-gray-500" />
                Clear Invalid
              </button>
              <button
                onClick={clearAll}
                disabled={queue.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-900 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5 text-gray-400" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[280px]">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-[#fafafa] border-b border-gray-100">
              <tr>
                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  URL
                </th>
                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Domain
                </th>
                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {queue.length > 0 ? (
                queue.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200"
                  >
                    <td className="px-3 sm:px-6 py-5 sm:py-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 rounded-2xl shadow-sm flex-shrink-0 flex items-center justify-center text-orange-600 border border-orange-100/60">
                          <LinkIcon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="text-sm sm:text-[15px] font-bold text-gray-900 line-clamp-1 leading-snug">
                            {item.url}
                          </p>
                          <p className="text-[11px] sm:text-xs text-gray-400 font-semibold tracking-wide">
                            Added {new Date(item.addedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-[11px] sm:text-[13px] font-bold text-gray-500">
                      {item.domain || "—"}
                    </td>
                    <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap">
                      {item.status === "Queued" ? (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-gray-900 text-white shadow-md">
                          Queued
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-600 text-white shadow-md shadow-red-500/20">
                          Invalid
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => remove(item.id)}
                          className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center text-gray-500">
                    <p className="font-medium text-gray-400">No URLs queued yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

