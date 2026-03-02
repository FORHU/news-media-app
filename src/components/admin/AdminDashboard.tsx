"use client";

import React from 'react';
import {
    FileText,
    Globe,
    Link as LinkIcon,
    TrendingUp,
    Activity,
    Clock,
    ArrowUpRight
} from 'lucide-react';

const StatCard = ({ title, value, icon, color, description }: any) => (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
                {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">{title}</p>
            <h3 className="text-4xl font-extrabold text-gray-900 leading-tight">{value}</h3>
            {description && <p className="text-xs text-gray-500 mt-2 font-medium">{description}</p>}
        </div>
    </div>
);

export default function AdminDashboard() {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#ff4500] font-bold text-xs uppercase tracking-widest mb-1">
                    <Activity className="w-4 h-4" />
                    System Overview
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                <p className="text-gray-500 font-medium">Real-time performance and crawling metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Generated Articles"
                    value="0"
                    description="+0 from last week"
                    icon={<FileText />}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Crawled Articles"
                    value="0"
                    description="+0 from today"
                    icon={<Globe />}
                    color="bg-green-600"
                />
                <StatCard
                    title="Crawled URLs"
                    value="0"
                    description="Across 0 sources"
                    icon={<LinkIcon />}
                    color="bg-purple-600"
                />
                <StatCard
                    title="Active Crawlers"
                    value="0"
                    description="System health: 100%"
                    icon={<TrendingUp />}
                    color="bg-[#ff4500]"
                />
            </div>

            {/* Lower Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Recent System Activity</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Monitor live crawling and generation logs.</p>
                        </div>
                        <button className="text-sm font-bold text-[#ff4500] hover:underline">View All</button>
                    </div>

                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Clock className="w-8 h-8 text-gray-300" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-gray-900">No Activity Yet</h3>
                            <p className="text-sm text-gray-400 max-w-[240px] font-medium leading-relaxed">
                                Once the system starts crawling, logs will appear here in real-time.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-2">Crawler Status</h2>
                        <p className="text-gray-400 text-sm font-medium mb-8">Queue processing efficiency.</p>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-gray-400">System Load</span>
                                <span className="text-2xl font-black">0%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="w-0 h-full bg-[#ff4500] rounded-full transition-all duration-1000"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 relative z-10">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Last Update</p>
                            <p className="text-sm font-medium text-white">{new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>

                    {/* Decorative element */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#ff4500] rounded-full blur-[80px] opacity-20"></div>
                </div>
            </div>
        </div>
    );
}

