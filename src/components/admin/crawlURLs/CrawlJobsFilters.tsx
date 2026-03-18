"use client";

import React from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function toLocalISODate(value: Date | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CrawlJobsFilters({
  status,
  dateFrom,
  dateTo,
  query,
  filteredCount,
  onStatusChange,
  onRangeChange,
  onQueryChange,
  onClear,
}: {
  status: string;
  dateFrom: string;
  dateTo: string;
  query: string;
  filteredCount: number;
  onStatusChange: (status: string) => void;
  onRangeChange: (from: string, to: string) => void;
  onQueryChange: (q: string) => void;
  onClear: () => void;
}) {
  const showClear = status !== "all" || !!dateFrom || !!dateTo || !!query;

  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] px-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">
            Status
          </label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white text-sm font-semibold text-gray-900 focus-visible:ring-orange-200/70">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="crawling">Crawling</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">
            Date range
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full justify-start rounded-xl border-gray-200 bg-white text-left text-sm font-semibold text-gray-900 hover:bg-white"
              >
                {dateFrom && dateTo
                  ? `${format(new Date(dateFrom), "MMM d, yyyy")} – ${format(
                      new Date(dateTo),
                      "MMM d, yyyy"
                    )}`
                  : dateFrom
                    ? `${format(new Date(dateFrom), "MMM d, yyyy")} – …`
                    : dateTo
                      ? `… – ${format(new Date(dateTo), "MMM d, yyyy")}`
                      : (
                          <span className="text-gray-400 font-semibold">
                            Pick a date range
                          </span>
                        )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: dateFrom ? new Date(dateFrom) : undefined,
                  to: dateTo ? new Date(dateTo) : undefined,
                }}
                onSelect={(range) => {
                  onRangeChange(
                    toLocalISODate(range?.from ?? null),
                    toLocalISODate(range?.to ?? null)
                  );
                }}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">
            URL / Source
          </label>
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search domain or URL…"
            className="h-10 rounded-xl border-gray-200 bg-white text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus-visible:ring-orange-200/70"
          />
        </div>
      </div>

      {showClear && (
        <div className="pt-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500">
            Showing <span className="text-gray-900">{filteredCount}</span>{" "}
            result{filteredCount === 1 ? "" : "s"} on this page
          </p>
          <Button
            onClick={onClear}
            variant="link"
            size="sm"
            className="px-0 text-xs font-black uppercase tracking-widest text-[#ff4500] hover:text-orange-600"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

