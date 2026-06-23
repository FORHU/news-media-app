"use client";

import React from "react";
import { Calendar, X, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [urls, setUrls] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return formatDateInput(d);
  });
  const [endDate, setEndDate] = React.useState(() => formatDateInput(new Date()));
  const [maxArticles, setMaxArticles] = React.useState(5);
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
      onSuccess?.();
    },
  });

  const addUrl = React.useCallback(() => {
    if (!singleUrl.trim()) return;
    const valid = getValidUrls([singleUrl]);
    if (valid.length === 0) {
      setValidationError("Please enter a valid URL.");
      return;
    }
    setUrls((prev) => {
      const seen = new Set(prev.map((u) => u.toLowerCase()));
      const added = valid.filter((u) => !seen.has(u.toLowerCase()));
      return [...added, ...prev];
    });
    setSingleUrl("");
    setValidationError(null);
  }, [singleUrl]);

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
        : getValidUrls([singleUrl]);

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
      max_requests_per_crawl: maxArticles,
    });
  }, [endDate, maxArticles, singleUrl, startDate, startCrawlMutation, urls]);

  const effectiveUrls =
    urls.length > 0 ? urls : getValidUrls([singleUrl]);
  const canStart = effectiveUrls.length > 0;
  const error =
    startCrawlMutation.error instanceof Error
      ? startCrawlMutation.error.message
      : startCrawlMutation.error
        ? "Failed to start crawl"
        : null;

  const starting = startCrawlMutation.isPending;
  const uiError = validationError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[600px] p-0 overflow-hidden rounded-[1.5rem] border-none shadow-2xl bg-white"
      >
        {/* Header - Simplified as per basis */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">
                  Crawl Configuration
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-[10px] font-black uppercase tracking-[0.1em] mt-0.5">
                  Set parameters for the scraping agent
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </Button>
        </div>

        <div className="px-8 py-6 space-y-8">
          {uiError && (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-100 bg-red-50/50 px-5 py-3 text-[11px] text-red-600 font-black uppercase tracking-widest flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {uiError}
            </motion.div>
          )}

          {/* Section 01: Website URLs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-black shadow-lg">
                        01
                    </div>
                    <span className="font-black text-gray-900 tracking-[0.05em] uppercase text-sm">TARGET SOURCES</span>
                </div>
                {urls.length > 0 && (
                    <span className="px-3 py-1 rounded-full bg-orange-50 text-[10px] font-black text-orange-600 uppercase tracking-widest border border-orange-100">
                        {urls.length} Selected
                    </span>
                )}
            </div>
            
            <div className="flex gap-2 p-1 bg-white rounded-xl border border-gray-100 shadow-sm focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/5 transition-all">
              <Input
                type="url"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addUrl())
                }
                placeholder="https://example-news.com/feed"
                className="h-11 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm font-medium"
              />
              <Button
                type="button"
                onClick={addUrl}
                className="h-11 px-6 rounded-lg bg-gray-900 text-white hover:bg-black font-bold transition-all active:scale-95"
              >
                Add
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
                {urls.length > 0 && (
                <motion.ul 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar"
                >
                    {urls.map((u) => (
                    <motion.li
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={u}
                        className="group flex items-center justify-between text-sm bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:bg-white hover:border-orange-200 transition-all"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <span className="truncate text-gray-700 font-bold text-xs">{u}</span>
                        </div>
                        <Button
                            type="button"
                            onClick={() => removeUrl(u)}
                            variant="ghost"
                            size="icon-sm"
                            className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.li>
                    ))}
                </motion.ul>
                )}
            </AnimatePresence>
          </div>

          {/* Section 02: Date Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-black shadow-lg">
                    02
                </div>
                <span className="font-black text-gray-900 tracking-[0.05em] uppercase text-sm">DATE RANGE</span>
            </div>

            <Popover>
                <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-14 w-full justify-start rounded-xl border-gray-100 bg-white text-left text-sm font-bold text-gray-900 hover:border-orange-500 transition-all shadow-sm group"
                >
                    <Calendar className="w-4 h-4 mr-3 text-orange-500 transition-transform group-hover:scale-110" />
                    {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "MMMM d, yyyy")} – ${format(dateRange.to, "MMMM d, yyyy")}`
                    : <span className="text-gray-400">Select target dates</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="start">
                <ShadCalendar
                    mode="range"
                    numberOfMonths={1}
                    selected={dateRange}
                    onSelect={(range) => {
                    setStartDate(range?.from ? formatDateInput(range.from) : formatDateInput(new Date()));
                    setEndDate(range?.to ? formatDateInput(range.to) : formatDateInput(new Date()));
                    }}
                    initialFocus
                    className="p-3"
                />
                </PopoverContent>
            </Popover>
          </div>

          {/* Section 03: Quantity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-black shadow-lg">
                    03
                </div>
                <span className="font-black text-gray-900 tracking-[0.05em] uppercase text-sm">QUANTITY CAP</span>
            </div>

            <div className="relative">
                <Input
                    type="number"
                    min={1}
                    value={maxArticles}
                    onChange={(e) =>
                        setMaxArticles(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="h-14 w-full rounded-xl border-gray-100 bg-white text-sm font-bold focus-visible:ring-orange-500/10 focus-visible:border-orange-500 shadow-sm pl-4 pr-12"
                    placeholder="Maximum articles to fetch"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Articles
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="rounded-lg font-black uppercase text-[11px] tracking-widest text-gray-400 hover:text-gray-900 transition-all"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={startCrawl}
            disabled={!canStart || starting}
            className="h-12 px-8 rounded-lg font-black uppercase text-[11px] tracking-widest bg-orange-500 text-white shadow-xl shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {starting ? "Starting agent..." : "Start Crawling"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
