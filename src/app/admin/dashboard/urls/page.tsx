import React, { Suspense } from "react";
import ManageTargets from "@/components/admin/ContentSourcing/WebScraping/ManageTargets/ManageTargets";

export default async function CrawlUrlsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 font-medium animate-pulse">Loading...</div>}>
      <ManageTargets />
    </Suspense>
  );
}
