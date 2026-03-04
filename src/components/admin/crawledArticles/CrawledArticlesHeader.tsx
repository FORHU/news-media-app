import React from "react";

export function CrawledArticlesHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Crawled Articles
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Review and manage articles discovered by the automated crawler
                </p>
            </div>
        </div>
    );
}