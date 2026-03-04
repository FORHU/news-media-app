"use client";

import React, { useState } from 'react';
import ButtonDropdowns from '@/components/admin/ButtonDropdowns';
import {
    Plus,
    Search,
    Filter,
    Globe,
    MoreHorizontal,
    Power,
    ExternalLink,
    Link as LinkIcon
} from 'lucide-react';

export default function CrawledUrlsPage() {
    const [filterStatus, setFilterStatus] = useState('All Status');
    const sources: any[] = [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Source Management</h1>
                <p className="text-gray-500 font-medium">Configure and monitor automated news sources</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search sources..."
                        className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-gray-50 border-none rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <ButtonDropdowns
                        options={['All Status', 'Active', 'Paused']}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        icon={<Filter className="w-4 h-4" />}
                        className="flex-1 md:flex-none md:w-48"
                    />

                    <button className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-gray-900 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg transition-all active:scale-95">
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="whitespace-nowrap">Add Source</span>
                    </button>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-[#fafafa] border-b border-gray-100">
                            <tr>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">SOURCE NAME</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">DOMAIN</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">STATUS</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">FREQUENCY</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {sources.length > 0 ? (
                                sources.map((source) => (
                                    <tr key={source.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200">
                                        <td className="px-3 sm:px-6 py-5 sm:py-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-2xl shadow-lg flex-shrink-0 flex items-center justify-center text-blue-600 border border-blue-100/50">
                                                    <Globe className="w-6 h-6 sm:w-8 sm:h-8" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm sm:text-[15px] font-bold text-gray-900 line-clamp-1 leading-snug">
                                                        {source.name}
                                                    </p>
                                                    <p className="text-[11px] sm:text-xs text-gray-400 font-semibold tracking-wide truncate max-w-[200px]">
                                                        {source.url}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-[11px] sm:text-[13px] font-bold text-gray-500">
                                                <span className="truncate max-w-[150px]">{source.url}</span>
                                                <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-md text-white ${source.status === 'Active'
                                                ? 'bg-green-600 shadow-green-500/20'
                                                : 'bg-gray-400 shadow-gray-400/20'
                                                }`}>
                                                {source.status}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-[11px] sm:text-[13px] font-bold text-gray-500">
                                            {source.frequency}
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
                                                    <Power className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-32 text-center text-gray-500">
                                        <p className="font-medium text-gray-400">No crawl sources configured yet.</p>
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

