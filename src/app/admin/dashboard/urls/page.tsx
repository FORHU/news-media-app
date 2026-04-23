import React, { Suspense } from "react";
import CrawlUrlsManager from "@/components/admin/crawlURLs/CrawlUrlsManager";

export default async function CrawlUrlsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 font-medium animate-pulse">Loading...</div>}>
      <CrawlUrlsManager />
    </Suspense>
  );
}
