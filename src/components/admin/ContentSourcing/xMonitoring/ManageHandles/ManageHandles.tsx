"use client";

import React from "react";
import { Twitter, Plus, Search } from "lucide-react";
// import CrawlXConfigurationModal from "./CrawlXConfigurationModal"; // TODO: Implement
// import CrawlXJobsTable from "./CrawlXJobsTable"; // TODO: Implement
import { useQueryClient } from "@tanstack/react-query";

export default function ManageHandles() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          X Monitoring
        </h1>
        <p className="text-gray-500 font-medium">
          Configure X profiles and keywords to crawl for AI content generation
        </p>
      </div>

      {/* X Crawler Configuration Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Twitter className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Monitoring Configuration
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              Add X handles or search terms to monitor for new content
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Start X Crawl
        </button>
      </div>

      {/* Placeholder for Crawl Jobs List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Search className="w-10 h-10 text-blue-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No X Crawl Jobs Found</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          You haven't configured any X crawling jobs yet. Start by adding an X handle or search term.
        </p>
      </div>

      {/* <CrawlXConfigurationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["crawlXJobs"] });
        }}
      /> */}
    </div>
  );
}
