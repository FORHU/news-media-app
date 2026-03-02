"use client";

import React from 'react';
import {
    Plus,
    Search,
    Filter,
    ChevronDown,
    Edit2,
    Trash2,
    Sparkles,
    FileText,
    Play
} from 'lucide-react';

export default function GeneratedArticles() {
    // No static articles/contents as requested
    const articles: any[] = [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Generated Article Management</h1>
                <p className="text-gray-500 font-medium">Manage articles and blogs across all categories</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer">
                            <option>All Types</option>
                            <option>News</option>
                            <option>Blog</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <select className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer">
                            <option>All Categories</option>
                            <option>Business & Finance</option>
                            <option>Technology & Innovation</option>
                            <option>Opinion / Editorials</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>

                    <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ff4500] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#ff4500] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="w-5 h-5" />
                        Create New
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Articles</p>
                    <h3 className="text-5xl font-extrabold text-gray-900 leading-tight">0</h3>
                </div>

                <div className="bg-[#eff6ff] p-8 rounded-3xl border border-blue-50 transition-all hover:shadow-md">
                    <p className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-1">News Articles</p>
                    <h3 className="text-5xl font-extrabold text-blue-600 leading-tight">0</h3>
                </div>

                <div className="bg-[#f5f3ff] p-8 rounded-3xl border border-purple-50 transition-all hover:shadow-md">
                    <p className="text-purple-500 text-xs font-bold uppercase tracking-widest mb-1">Blog Posts</p>
                    <h3 className="text-5xl font-extrabold text-purple-600 leading-tight">0</h3>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-[#fafafa] border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Title</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Type</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">AI</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {articles.length > 0 ? (
                            articles.map((article) => (
                                <tr key={article.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-200 overflow-hidden flex-shrink-0 relative shadow-sm">
                                                {/* Placeholder for actual image */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <h4 className="text-[15px] font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{article.title}</h4>
                                                <p className="text-xs text-gray-400 font-medium">5 min read</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-[11px] font-bold tracking-tight">
                                            {article.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${article.type === 'news' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                                            }`}>
                                            {article.type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <Sparkles className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-500">
                                        {article.date}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                                        <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center">
                                            <Play className="w-8 h-8 text-[#ff4500] fill-[#ff4500]" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-gray-900">Get Started</h3>
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed">No generated articles found. Click &apos;Create New&apos; to begin.</p>
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

