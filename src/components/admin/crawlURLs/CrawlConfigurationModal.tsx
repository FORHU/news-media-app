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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadCalendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { crawlConfigurationSchema } from "@/lib/validation/crawl";
import { useMutation } from "@tanstack/react-query";

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

function parseISODateInput(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
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
  const [maxArticles, setMaxArticles] = React.useState(10);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const startCrawlMutation = useMutation({
    mutationFn: async (payload: {
      urls: string[];
      start_date: string;
      end_date: string;
      max_requests_per_crawl: number;
    }) => {
      const res = await fetch(
        "/api/admin/crawledArticles/crawlUrl",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = (await res.json()) as { error?: string; message?: string };
          if (typeof data?.error === "string") msg = data.error;
          else if (typeof data?.message === "string") msg = data.message;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      return (await res.json().catch(() => null)) as unknown;
    },
    onSuccess: () => {
      onOpenChange(false);
      setUrls([]);
      setSingleUrl("");
      setBulk("");
      onSuccess?.();
    },
  });

  const addUrl = React.useCallback(() => {
    const items = singleUrl.trim() ? [singleUrl] : splitBulk(bulk);
    const valid = getValidUrls(items);
    if (valid.length === 0) {
      setValidationError("Add at least one valid URL.");
      return;
    }
    setUrls((prev) => {
      const seen = new Set(prev.map((u) => u.toLowerCase()));
      const added = valid.filter((u) => !seen.has(u.toLowerCase()));
      return [...added, ...prev];
    });
    setSingleUrl("");
    setBulk("");
    setValidationError(null);
  }, [singleUrl, bulk]);

  const removeUrl = React.useCallback((url: string) => {
    setUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  const dateRange = React.useMemo(() => {
    const from = parseISODateInput(startDate);
    const to = parseISODateInput(endDate);
    return { from, to };
  }, [endDate, startDate]);

  const startCrawl = React.useCallback(() => {
    const valid =
      urls.length > 0
        ? urls.filter((u) => getValidUrls([u]).length > 0)
        : getValidUrls(splitBulk(singleUrl || bulk));

    const parsed = crawlConfigurationSchema.safeParse({
      urls: valid,
      start_date: startDate,
      end_date: endDate,
      max_requests_per_crawl: maxArticles,
    });

    if (!parsed.success) {
      const first =
        parsed.error.issues[0]?.message ?? "Invalid crawl configuration.";
      setValidationError(first);
      return;
    }

    setValidationError(null);
    startCrawlMutation.mutate({
      urls: parsed.data.urls,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      max_requests_per_crawl: parsed.data.max_requests_per_crawl,
    });
  }, [bulk, endDate, maxArticles, singleUrl, startDate, startCrawlMutation, urls]);

  const effectiveUrls =
    urls.length > 0 ? urls : getValidUrls(splitBulk(singleUrl || bulk));
  const canStart = effectiveUrls.length > 0;
  const error =
    startCrawlMutation.error instanceof Error
      ? startCrawlMutation.error.message
      : startCrawlMutation.error
        ? "Failed to start crawl"
        : null;
  const starting = startCrawlMutation.isPending;
  const emptyUrlsError = canStart ? null : "Add at least one valid URL.";
  const uiError = validationError || emptyUrlsError || error;

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
          {uiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {uiError}
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
              <Input
                type="url"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addUrl())
                }
                placeholder="https://example.com/news"
                className="h-11 flex-1 rounded-xl bg-gray-50 border-gray-100 text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-200"
              />
              <Button
                type="button"
                onClick={addUrl}
                variant="secondary"
                className="h-11 rounded-xl bg-orange-100 text-gray-900 hover:bg-orange-200 font-bold"
              >
                <Plus className="w-4 h-4" />
                Add URL
              </Button>
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
                    <Button
                      type="button"
                      onClick={() => removeUrl(u)}
                      variant="link"
                      size="xs"
                      className="px-0 text-red-500 hover:text-red-600"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder="Or paste multiple URLs (one per line)..."
              rows={2}
              className="w-full rounded-xl bg-gray-50 border-gray-100 text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-200 resize-none"
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
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-600">
                  Date Range
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full justify-start rounded-xl border-gray-100 bg-gray-50 text-left text-sm font-semibold text-gray-900 hover:bg-white"
                    >
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {dateRange.from && dateRange.to
                        ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
                        : dateRange.from
                          ? `${format(dateRange.from, "MMM d, yyyy")} – …`
                          : dateRange.to
                            ? `… – ${format(dateRange.to, "MMM d, yyyy")}`
                            : <span className="text-gray-400 font-semibold">Pick a date range</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <ShadCalendar
                      mode="range"
                      numberOfMonths={2}
                      selected={dateRange}
                      onSelect={(range) => {
                        setStartDate(range?.from ? formatDateInput(range.from) : formatDateInput(new Date()));
                        setEndDate(range?.to ? formatDateInput(range.to) : formatDateInput(new Date()));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">
                  # Max Articles
                </span>
                <Input
                  type="number"
                  min={1}
                  value={maxArticles}
                  onChange={(e) =>
                    setMaxArticles(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="h-11 w-full rounded-xl bg-gray-50 border-gray-100 text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-200"
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
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={startCrawl}
            disabled={!canStart || starting}
            className="rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-60"
          >
            <CirclePlay className="w-4 h-4" />
            {starting ? "Starting..." : "Start Crawling"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
