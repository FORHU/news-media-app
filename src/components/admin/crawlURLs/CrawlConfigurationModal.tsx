"use client";

import React from "react";
import { CirclePlay, Plus, Lightbulb, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CrawlConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function normalizeUrl(raw: string): { url: string; valid: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: "", valid: false };
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname) return { url: trimmed, valid: false };
    return { url: u.toString(), valid: true };
  } catch {
    return { url: trimmed, valid: false };
  }
}

function splitBulk(input: string): string[] {
  return input
    .split(/[\n,\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getValidUrls(rawUrls: string[]): string[] {
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

function formatDateInput(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CrawlConfigurationModal({
  open,
  onOpenChange,
  onSuccess,
}: CrawlConfigurationModalProps) {
  const [singleUrl, setSingleUrl] = React.useState("");
  const [bulk, setBulk] = React.useState("");
  const [urls, setUrls] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateInput(d);
  });
  const [endDate, setEndDate] = React.useState(() => formatDateInput(new Date()));
  const [maxArticles, setMaxArticles] = React.useState(50);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addUrl = React.useCallback(() => {
    const items = singleUrl.trim() ? [singleUrl] : splitBulk(bulk);
    const valid = getValidUrls(items);
    if (valid.length === 0) {
      setError("Add at least one valid URL.");
      return;
    }
    setUrls((prev) => {
      const seen = new Set(prev.map((u) => u.toLowerCase()));
      const added = valid.filter((u) => !seen.has(u.toLowerCase()));
      return [...added, ...prev];
    });
    setSingleUrl("");
    setBulk("");
    setError(null);
  }, [singleUrl, bulk]);

  const removeUrl = React.useCallback((url: string) => {
    setUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  const startCrawl = React.useCallback(async () => {
    const valid =
      urls.length > 0
        ? urls.filter((u) => getValidUrls([u]).length > 0)
        : getValidUrls(splitBulk(singleUrl || bulk));
    if (valid.length === 0) {
      setError("Add at least one valid URL to start crawling.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: valid,
          start_date: startDate,
          end_date: endDate,
          max_requests_per_crawl: maxArticles,
        }),
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = (await res.json()) as { error?: string };
          if (typeof data?.error === "string") msg = data.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      onOpenChange(false);
      setUrls([]);
      setSingleUrl("");
      setBulk("");
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start crawl");
    } finally {
      setStarting(false);
    }
  }, [bulk, endDate, maxArticles, singleUrl, startDate, urls, onOpenChange, onSuccess]);

  const effectiveUrls =
    urls.length > 0 ? urls : getValidUrls(splitBulk(singleUrl || bulk));
  const canStart = effectiveUrls.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border-gray-200"
      >
        {/* Dark Header */}
        <div className="bg-gray-900 px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <CirclePlay className="w-5 h-5 text-orange-400 fill-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                New Crawl Configuration
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm mt-0.5">
                Configure websites and parameters for AI content generation
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Website URLs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span className="font-bold text-gray-900">
                Website URLs to Crawl
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addUrl())
                }
                placeholder="https://example.com/news"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
              />
              <button
                type="button"
                onClick={addUrl}
                className="flex items-center gap-2 px-4 py-3 bg-orange-100 text-gray-900 rounded-xl font-bold text-sm hover:bg-orange-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add URL
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Add one or more website URLs to crawl for content
            </p>
            {urls.length > 0 && (
              <ul className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                {urls.map((u) => (
                  <li
                    key={u}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="truncate text-gray-700">{u}</span>
                    <button
                      type="button"
                      onClick={() => removeUrl(u)}
                      className="text-red-500 hover:text-red-600 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder="Or paste multiple URLs (one per line)..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none resize-none"
            />
          </div>

          {/* Section 2: Crawl Parameters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span className="font-bold text-gray-900">
                Crawl Parameters
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">
                  Start Date
                </span>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                  />
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">
                  End Date
                </span>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                  />
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">
                  # Max Articles
                </span>
                <input
                  type="number"
                  min={1}
                  value={maxArticles}
                  onChange={(e) =>
                    setMaxArticles(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                />
              </label>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">
                The crawler will fetch articles published between these dates,
                up to the maximum count specified.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={startCrawl}
            disabled={!canStart || starting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            <CirclePlay className="w-4 h-4" />
            {starting ? "Starting..." : "Start Crawling"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
