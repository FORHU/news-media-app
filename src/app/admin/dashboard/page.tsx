'use client';

import React from 'react';
import {
    Activity,
    ArrowUpRight
} from 'lucide-react';
import DashboardStatsGrid from '@/components/admin/dashboard/DashboardStatsGrid';
import ActivityFeed from '@/components/admin/dashboard/ActivityFeed';
import QueueStatusCard from '@/components/admin/dashboard/HealthMetricsCard';
import { useQuery } from '@tanstack/react-query';

export default function DashboardPage() {
    const { data, isFetching, isLoading } = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: async () => {
            const res = await fetch('/api/admin/dashboard');
            if (!res.ok) throw new Error('Failed to load dashboard stats');
            return res.json();
        },
        // Keep cached data when navigating away/back.
        // With global staleTime=5min, it will not refetch on remount if still fresh.
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        // Dashboard wants periodic updates while you’re on the page.
        refetchInterval: 10_000,
    });

    const loading = isLoading && !data;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[#ff4500] font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">
                        <div className="relative">
                            <Activity className="w-3.5 h-3.5 md:w-4 h-4" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                        </div>
                        System Overview
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm md:text-base text-gray-500 font-medium">Monitoring real-time intelligence & crawler health.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network Status</span>
                        <span className="text-xs font-bold text-green-600">Stable (24ms)</span>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95 group">
                        Export Report
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Real-time Polling Stats Grid Component */}
            <DashboardStatsGrid stats={data} loading={loading || isFetching} />

            {/* Lower Section: Activity Feed & Health Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Card */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500">
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900">Recent Activity</h2>
                            <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Live updates from crawlers and AI generators.</p>
                        </div>
                        <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-[#ff4500] border border-gray-100 hover:border-orange-100 rounded-xl transition-all">
                            View Archive
                        </button>
                    </div>

                    <div className="relative z-10">
                        <ActivityFeed 
                            activities={data?.recentActivity || []} 
                            loading={loading} 
                        />
                    </div>

                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50"></div>
                </div>

                {/* System Status Card */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col group hover:shadow-md transition-all duration-500">
                   <QueueStatusCard data={data} />
                   
                   {/* Decorative background pulse */}
                   <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-100 rounded-full blur-[80px] opacity-30 group-hover:opacity-50 transition-all duration-700"></div>
                </div>
            </div>
        </div>
    );
}



