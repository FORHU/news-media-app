"use client";

import React from 'react';
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

export default function CrawledUrls() {
    // No static content as requested
    const sources: any[] = [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Source Management</h1>
                <p className="text-gray-500 font-medium">Configure and monitor automated news sources</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search sources..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Paused</option>
                        </select>
                    </div>

                    <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="w-5 h-5" />
                        Add Source
                    </button>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-[#fafafa] border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Source Name</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Domain</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Frequency</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sources.length > 0 ? (
                            sources.map((source) => (
                                <tr key={source.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Globe className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <h4 className="text-[15px] font-bold text-gray-900">{source.name}</h4>
                                                <p className="text-xs text-gray-400 font-medium">System Source</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                            {source.url}
                                            <ExternalLink className="w-3 h-3 text-gray-300" />
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${source.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {source.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-500">
                                        {source.frequency}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                                <Power className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                                        <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center">
                                            <LinkIcon className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-gray-900">No Sources</h3>
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                                No sources added yet. Click &apos;Add Source&apos; to get started with automated crawling.
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

