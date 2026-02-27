"use client";

import React from 'react';
import { Plus, Globe, Trash2, Play } from 'lucide-react';

export default function CrawledUrls() {
    const sources = [
        { id: 1, url: "https://reuters.com", status: "Active", frequency: "Every 1h" },
        { id: 2, url: "https://bbc.co.uk/news", status: "Active", frequency: "Every 4h" },
        { id: 3, url: "https://techcrunch.com", status: "Paused", frequency: "Manual" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Crawled URLs & Sources</h1>
                <button className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Source
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Source URL</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Frequency</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sources.map((source) => (
                            <tr key={source.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg"><Globe className="w-4 h-4 text-gray-600" /></div>
                                        <span className="text-sm text-gray-900 font-medium">{source.url}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{source.frequency}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${source.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {source.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors"><Play className="w-4 h-4" /></button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
