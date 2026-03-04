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

export default function GeneratedArticlesPage() {
    const articles: any[] = [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Generated Article Management</h1>
                <p className="text-gray-500 font-medium">Manage articles and blogs across all categories</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-gray-50 border-none rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="flex-1 md:flex-none flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <Filter className="w-3.5 h-3.5 text-gray-500" />
                        <select className="bg-transparent border-none text-[10px] md:text-sm font-semibold text-gray-700 focus:ring-0 outline-none cursor-pointer w-full">
                            <option>All Types</option>
                            <option>News</option>
                            <option>Blog</option>
                        </select>
                    </div>

                    <button className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-[#ff4500] to-[#ff6b35] text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="whitespace-nowrap">Create New</span>
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
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-[#fafafa] border-b border-gray-100">
                            <tr>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">TITLE</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">CATEGORY</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">TYPE</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">AI</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">DATE</th>
                                <th className="px-3 sm:px-6 py-5 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {articles.length > 0 ? (
                                articles.map((article) => (
                                    <tr key={article.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200">
                                        <td className="px-3 sm:px-6 py-5 sm:py-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-2xl shadow-lg flex-shrink-0 overflow-hidden relative border border-gray-100">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-gray-500" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm sm:text-[15px] font-bold text-gray-900 line-clamp-2 leading-snug">
                                                        {article.title}
                                                    </p>
                                                    <p className="text-[11px] sm:text-xs text-gray-400 font-semibold tracking-wide">
                                                        5 min read
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap">
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200/50">
                                                {article.category}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-md text-white ${article.type === 'news'
                                                    ? 'bg-blue-600 shadow-blue-500/20'
                                                    : 'bg-purple-600 shadow-purple-500/20'
                                                    }`}
                                            >
                                                {article.type}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap">
                                            <span className="flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff4500] fill-[#ff4500]/10 animate-pulse" />
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-[11px] sm:text-[13px] text-gray-500 font-bold">
                                            {article.date}
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                <button
                                                    className="inline-flex items-center justify-center p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                                                >
                                                    <Edit2 className="w-[18px] h-[18px]" />
                                                </button>
                                                <button
                                                    className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                                                >
                                                    <Trash2 className="w-[18px] h-[18px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-32 text-center text-gray-500">
                                        <p className="font-medium text-gray-400">No articles found.</p>
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

