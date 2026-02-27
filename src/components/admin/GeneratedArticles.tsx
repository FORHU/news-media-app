"use client";

import React from 'react';
import { Edit2, Eye, Trash2 } from 'lucide-react';

export default function GeneratedArticles() {
    const articles = [
        { id: 1, title: "The Future of AI in Media", status: "Published", date: "2025-05-20" },
        { id: 2, title: "Latest Tech Trends", status: "Draft", date: "2025-05-21" },
        { id: 3, title: "Next.js 16 Features", status: "Published", date: "2025-05-22" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Generated Articles</h1>
                <button className="bg-[#ff4500] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e63e00] transition-colors">
                    Create New
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Title</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Created At</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {articles.map((article) => (
                            <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{article.title}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${article.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {article.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{article.date}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
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
