'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import DashboardStatsGrid from '@/components/admin/dashboard/DashboardStatsGrid';
import ActivityFeed from '@/components/admin/dashboard/ActivityFeed';
import QueueStatusCard from '@/components/admin/dashboard/HealthMetricsCard';
import NeedsAttention from '@/components/admin/dashboard/NeedsAttention';
import { useQuery } from '@tanstack/react-query';
import { getSiteNameFromDomain, getSiteIconFromDomain } from '@/lib/tenant-utils';

/** "Updated 2 minutes ago", re-rendered every 30s so the age doesn't freeze. */
function UpdatedAgo({ at, failed }: { at: number; failed: boolean }) {
    const [, tick] = React.useReducer((n: number) => n + 1, 0);
    useEffect(() => {
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, []);

    if (!at) return null;
    const age = formatDistanceToNow(new Date(at), { addSuffix: true });
    return (
        <span className={`text-xs font-semibold ${failed ? 'text-red-800' : 'text-gray-600'}`}>
            {failed ? `Couldn't refresh. Showing data from ${age}` : `Updated ${age}`}
        </span>
    );
}

export default function DashboardPage() {
    const { data, isFetching, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
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
        refetchInterval: process.env.NODE_ENV !== "production" ? 30_000 : false,
    });

    // Set domain-specific title and favicon
    useEffect(() => {
        const hostname = window.location.hostname.toLowerCase();
        const siteName = getSiteNameFromDomain(hostname);
        const iconPath = getSiteIconFromDomain(hostname);

        document.title = `Admin Dashboard | ${siteName}`;

        // Dynamic Favicon update
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement || document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = iconPath;
        if (!document.querySelector('link[rel="icon"]')) {
            document.head.appendChild(favicon);
        }
    }, []);

    const loading = isLoading && !data;
    // Failed with nothing cached: show dashes, not zeros that look like real counts.
    const unavailable = isError && !data;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-sm md:text-base text-gray-600 font-medium">
                        What needs attention now, and what was produced recently.
                    </p>
                </div>

                <div className="flex items-center gap-3" aria-live="polite">
                    <UpdatedAgo at={dataUpdatedAt} failed={isError && !!data} />
                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        aria-label={isFetching ? 'Refreshing' : 'Refresh dashboard'}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden />
                        Refresh
                    </button>
                </div>
            </div>

            {unavailable ? (
                <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-4">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-900">Couldn&apos;t load the dashboard figures.</p>
                        <p className="text-xs font-medium text-red-800 mt-0.5">
                            The counts below are hidden rather than shown as zero. Check your connection and try again.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="shrink-0 rounded-xl bg-red-800 text-white hover:bg-red-900 px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
                    >
                        Retry
                    </button>
                </div>
            ) : null}

            <NeedsAttention />

            <DashboardStatsGrid stats={data} loading={loading} unavailable={unavailable} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section aria-labelledby="recent-activity-heading" className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center gap-4 mb-8">
                        <div>
                            <h2 id="recent-activity-heading" className="text-xl md:text-2xl font-black text-gray-900">Recent activity</h2>
                            <p className="text-xs md:text-sm text-gray-600 font-medium mt-1">Latest generated and crawled articles.</p>
                        </div>
                        <Link
                            href="/admin/dashboard/generated"
                            className="shrink-0 px-4 py-2 text-xs font-bold text-gray-700 hover:text-orange-800 border border-gray-200 hover:border-orange-200 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                        >
                            View all articles
                        </Link>
                    </div>

                    <ActivityFeed
                        activities={data?.recentActivity || []}
                        loading={loading}
                        unavailable={unavailable}
                    />
                </section>

                <section aria-label="Queue status" className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                    <QueueStatusCard data={data} unavailable={unavailable} />
                </section>
            </div>
        </div>
    );
}
