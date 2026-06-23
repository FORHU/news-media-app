'use client';

import React from 'react';
import {
    FileText,
    Globe,
    Link as LinkIcon,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';
import type { dashboardService } from '@/services/admin/dashboard.service';

type DashboardStats = Awaited<ReturnType<typeof dashboardService.getStats>>;

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactElement<{ className?: string }>;
    color: string;
    description?: string;
    loading: boolean;
}

const StatCard = ({ title, value, icon, color, description, loading }: StatCardProps) => (
    <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${color} shadow-sm transition-all group-hover:shadow-md`}>
                {React.cloneElement(icon, { className: `w-5 h-5 md:w-6 md:h-6 text-white` })}
            </div>
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">{title}</p>
            {loading ? (
                 <div className="h-8 md:h-10 w-24 bg-gray-200 animate-pulse rounded my-1" />
            ) : (
                 <h3 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">{value}</h3>
            )}
            {description && <p className="text-[10px] md:text-xs text-gray-500 mt-2 font-medium">{description}</p>}
        </div>
    </div>
);

export default function DashboardStatsGrid({
    stats,
    loading,
}: {
    stats?: DashboardStats;
    loading: boolean;
}) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Generated Articles"
                value={stats?.generatedArticles?.total || 0}
                description={`+${stats?.generatedArticles?.addedLastWeek || 0} from last week`}
                icon={<FileText />}
                color="bg-blue-600"
                loading={loading}
            />
            <StatCard
                title="Crawled Articles"
                value={stats?.crawledArticles?.total || 0}
                description={`+${stats?.crawledArticles?.addedToday || 0} from today`}
                icon={<Globe />}
                color="bg-green-600"
                loading={loading}
            />
            <StatCard
                title="Crawled URLs"
                value={stats?.crawledUrls?.total || 0}
                description={`Total unique sources tracked`}
                icon={<LinkIcon />}
                color="bg-purple-600"
                loading={loading}
            />
            <StatCard
                title="Active Crawlers"
                value={stats?.activeCrawlers?.total || 0}
                description="System health: 100%"
                icon={<TrendingUp />}
                color="bg-[#ff4500]"
                loading={loading}
            />
        </div>
    );
}
