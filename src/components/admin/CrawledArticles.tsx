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
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search crawled articles..."
                        className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-gray-50 border-none rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="flex-1 md:flex-none flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <Filter className="w-3.5 h-3.5 text-gray-500" />
                        <select className="bg-transparent border-none text-[10px] md:text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer w-full">
                            <option>All Sources</option>
                            <option>BBC News</option>
                            <option>TechCrunch</option>
                            <option>CNN</option>
                        </select>
                    </div>

                    <div className="flex-1 md:flex-none flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <select className="bg-transparent border-none text-[10px] md:text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer w-full">
                            <option>Today</option>
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-[#fafafa] border-b border-gray-100">
                            <tr>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">ARTICLE INFORMATION</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">SOURCE</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">STATUS</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">CRAWL DATE</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {crawledData.length > 0 ? (
                                crawledData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200">
                                        <td className="px-3 sm:px-6 py-5 sm:py-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl shadow-lg flex-shrink-0 overflow-hidden relative border border-gray-100">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-gray-300" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm sm:text-[15px] font-bold text-gray-900 line-clamp-2 leading-snug">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] sm:text-xs text-gray-400 font-semibold tracking-wide truncate max-w-[200px]">
                                                        Source: {item.source}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-[11px] sm:text-[13px] font-bold text-gray-500">
                                            {item.source}
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap">
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-green-600 text-white shadow-md shadow-green-500/20">
                                                Successfully Crawled
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-[11px] sm:text-[13px] font-bold text-gray-500">
                                            {item.date}
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
                                                    <ExternalLink className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-32 text-center text-gray-500">
                                        <p className="font-medium text-gray-400">No crawled articles available yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


