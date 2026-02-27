"use client";

import React from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';

export default function CrawledArticles() {
    const crawledData = [
        { id: 1, source: "Reuters", title: "Global Market Updates", date: "2h ago" },
        { id: 2, source: "BBC", title: "Environmental Policy Changes", date: "5h ago" },
        { id: 3, source: "TechCrunch", title: "New Startups to Watch", date: "1d ago" },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Crawled Articles</h1>

            <div className="grid grid-cols-1 gap-4">
                {crawledData.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#ff4500] uppercase tracking-wider">{item.source}</span>
                                <span className="text-xs text-gray-400">• {item.date}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black">
                                <ExternalLink className="w-4 h-4" /> Source
                            </button>
                            <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                                Generate Article
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
