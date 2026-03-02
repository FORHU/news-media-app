"use client";

import React from 'react';
import {
    Search,
    Filter,
    ChevronDown,
    Globe,
    ExternalLink,
    FileText,
    Newspaper,
    Calendar,
    ArrowUpRight,
    Eye
} from 'lucide-react';

export default function CrawledArticles() {
    // No static content as requested
    const crawledData: any[] = [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Crawled Articles</h1>
                <p className="text-gray-500 font-medium">Review and manage articles discovered by the automated crawler</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search crawled articles..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer">
                            <option>All Sources</option>
                            <option>BBC News</option>
                            <option>TechCrunch</option>
                            <option>CNN</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <select className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer">
                            <option>Today</option>
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-[#fafafa] border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Article Information</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Source</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Crawl Status</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Crawl Date</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {crawledData.length > 0 ? (
                            crawledData.map((item) => (
                                <tr key={item.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 relative border border-gray-100">
                                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-gray-300" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <h4 className="text-[15px] font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                                                <p className="text-xs text-gray-400 font-medium">Original URL: {item.url.substring(0, 30)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                                <Globe className="w-3 h-3 text-blue-600" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-600">{item.source}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                            Successfully Crawled
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-500">
                                        {item.date}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
                                            <Newspaper className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-gray-900">No Articles Yet</h3>
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                                No articles have been crawled yet. Check your source configurations or trigger a manual crawl.
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


