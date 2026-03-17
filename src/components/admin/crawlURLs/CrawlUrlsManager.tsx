"use client";

import React from "react";
import { Link as LinkIcon, Plus } from "lucide-react";
import CrawlConfigurationModal from "./CrawlConfigurationModal";
import CrawlJobsTable from "./CrawlJobsTable";
import { useQueryClient } from "@tanstack/react-query";

export default function CrawlUrlsManager() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Crawl URL Management
        </h1>
        <p className="text-gray-500 font-medium">
          Configure web crawling sources for AI content generation
        </p>
      </div>

      {/* Web Crawler Configuration Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
            <LinkIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Web Crawler Configuration
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              Configure websites to crawl for AI content generation
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Start New Crawl
        </button>
      </div>

      {/* Crawl Jobs List */}
      <CrawlJobsTable />

      <CrawlConfigurationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["crawlJobs"] });
        }}
      />
    </div>
  );
}
