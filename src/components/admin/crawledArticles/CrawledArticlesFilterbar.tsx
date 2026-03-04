"use client";

import { Search, Filter, Calendar } from "lucide-react";

interface CrawledArticlesFilterBarProps {
  searchQuery: string;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearDates: () => void;
}

export function CrawledArticlesFilterBar({
  searchQuery,
  startDate,
  endDate,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  onClearDates,
}: CrawledArticlesFilterBarProps) {
  return (
    <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search crawled articles by title, source, or URL..."
          className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-gray-50 border-none rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
        />
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-700">
            <span className="font-semibold uppercase tracking-wide">Date</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-[10px] md:text-xs text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-500 mr-1" />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <span className="hidden md:inline text-gray-500">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-transparent border-none text-[10px] md:text-xs focus:ring-0 outline-none"
              />
            </label>
            <span className="text-gray-400">–</span>
            <label className="flex items-center gap-1">
              <span className="hidden md:inline text-gray-500">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-transparent border-none text-[10px] md:text-xs focus:ring-0 outline-none"
              />
            </label>
          </div>
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={onClearDates}
            className="px-3 py-2 text-[10px] md:text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}

