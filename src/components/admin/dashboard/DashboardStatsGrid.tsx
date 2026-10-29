'use client';

import React from 'react';
import {
    FileText,
    Globe,
    Link as LinkIcon,
    Radar,
} from 'lucide-react';
import type { dashboardService } from '@/services/admin/dashboard.service';

type DashboardStats = Awaited<ReturnType<typeof dashboardService.getStats>>;

interface StatCardProps {
    title: string;
    /** null = the figure couldn't be loaded; shown as a dash, never as a misleading 0. */
    value: number | null;
    icon: React.ReactElement<{ className?: string }>;
    color: string;
    description?: string;
    loading: boolean;
}

const StatCard = ({ title, value, icon, color, description, loading }: StatCardProps) => (
    <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm">
        <div className="mb-4">
            <div className={`inline-flex p-3 md:p-4 rounded-xl md:rounded-2xl ${color} shadow-sm`}>
                {React.cloneElement(icon, { className: `w-5 h-5 md:w-6 md:h-6 text-white` })}
            </div>
        </div>
        <div>
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-1">{title}</p>
            {loading ? (
                 <div className="h-8 md:h-10 w-24 bg-gray-200 animate-pulse rounded my-1" aria-label="Loading" />
            ) : (
                 <p className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                    {value === null ? <span aria-label="Unavailable">&mdash;</span> : value}
                 </p>
            )}
            {description && !loading && value !== null ? (
                <p className="text-xs text-gray-600 mt-2 font-medium">{description}</p>
            ) : null}
        </div>
    </div>
);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function DashboardStatsGrid({
    stats,
    loading,
    unavailable = false,
}: {
    stats?: DashboardStats;
    loading: boolean;
    /** The dashboard request failed and there is no earlier data to show. */
    unavailable?: boolean;
}) {
    const num = (n: number | undefined) => (unavailable ? null : n ?? 0);
    const crawlers = stats?.activeCrawlers?.total ?? 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Generated Articles"
                value={num(stats?.generatedArticles?.total)}
                description={`${plural(stats?.generatedArticles?.addedLastWeek ?? 0, 'article', 'articles')} added in the last 7 days`}
                icon={<FileText />}
                color="bg-blue-700"
                loading={loading}
            />
            <StatCard
                title="Crawled Articles"
                value={num(stats?.crawledArticles?.total)}
                description={`${stats?.crawledArticles?.addedToday ?? 0} added today`}
                icon={<Globe />}
                color="bg-green-700"
                loading={loading}
            />
            <StatCard
                title="Crawled URLs"
                value={num(stats?.crawledUrls?.total)}
                description="Unique sources tracked"
                icon={<LinkIcon />}
                color="bg-purple-700"
                loading={loading}
            />
            <StatCard
                title="Active Crawlers"
                value={num(stats?.activeCrawlers?.total)}
                description={crawlers > 0 ? 'Crawl in progress' : 'No crawl running'}
                icon={<Radar />}
                color="bg-orange-700"
                loading={loading}
            />
        </div>
    );
}
