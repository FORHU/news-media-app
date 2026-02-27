"use client";

import React from 'react';
import { FileText, Globe, Link as LinkIcon, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Generated Articles"
                    value="128"
                    icon={<FileText />}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Crawled Articles"
                    value="456"
                    icon={<Globe />}
                    color="bg-green-600"
                />
                <StatCard
                    title="Crawled URLs"
                    value="1,204"
                    icon={<LinkIcon />}
                    color="bg-purple-600"
                />
                <StatCard
                    title="Active Crawlers"
                    value="12"
                    icon={<TrendingUp />}
                    color="bg-[#ff4500]"
                />
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis">New article crawled: "Tech trends for 2025..."</span>
                            </div>
                            <span className="text-gray-400">2 hours ago</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
