"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { articlesApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { CrawlJob, CrawlJobsResponse } from '@/lib/types';

export default function ActiveCrawlIndicator() {
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const crawlJobsQueryKey = ['crawlJobs', { page: 1, limit: 10 }] as const;

    const { data } = useQuery<CrawlJobsResponse>({
        queryKey: crawlJobsQueryKey,
        queryFn: () => articlesApi.getCrawlJobs({ page: 1, limit: 10 }),
    });

    const activeJobs = data?.jobs.filter(job => 
        ['CRAWLING', 'RUNNING', 'PROCESSING'].includes(job.status.toUpperCase())
    ) || [];

    const shouldShow = activeJobs.length > 0 && pathname !== '/admin/dashboard/urls';

    function normalizeUrls(raw: unknown): string[] {
        if (Array.isArray(raw)) return raw.filter((u) => typeof u === 'string' && u.trim());
        if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
        return [];
    }

    function mapRowToCrawlJob(row: any): CrawlJob | null {
        if (!row?.id) return null;

        return {
            id: row.id,
            status: row.status || 'Pending',
            urls: normalizeUrls(row.urls),
            maxArticlesRequest: typeof row.max_articles_request === 'number' ? row.max_articles_request : 0,
            articlesSaved: typeof row.articles_saved === 'number' ? row.articles_saved : 0,
            createdAt: row.created_at,
            startedAt: row.started_at,
            finishedAt: row.finished_at,
        };
    }

    function toMs(value: CrawlJob['createdAt']) {
        const d = value instanceof Date ? value : new Date(value);
        const t = d.getTime();
        return Number.isFinite(t) ? t : 0;
    }

    React.useEffect(() => {
        const channel = supabase
            .channel('realtime:crawl_jobs:indicator')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'crawl_jobs' },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    queryClient.setQueryData(crawlJobsQueryKey, (oldData: CrawlJobsResponse | undefined) => {
                        if (!oldData) return oldData;

                        let newJobs = [...oldData.jobs];

                        if (payload.eventType === 'INSERT') {
                            const inserted = mapRowToCrawlJob(payload.new);
                            if (inserted) newJobs = [inserted, ...newJobs];
                        }

                        if (payload.eventType === 'UPDATE') {
                            const updated = mapRowToCrawlJob(payload.new);
                            if (updated) {
                                const exists = newJobs.some((j) => j.id === updated.id);
                                newJobs = exists
                                    ? newJobs.map((j) => (j.id === updated.id ? updated : j))
                                    : [updated, ...newJobs];
                            }
                        }

                        if (payload.eventType === 'DELETE') {
                            const deletedId = payload.old?.id;
                            if (deletedId) newJobs = newJobs.filter((j) => j.id !== deletedId);
                        }

                        // Keep consistent with repository ordering: created_at desc, then trim to limit.
                        newJobs = newJobs
                            .slice()
                            .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
                            .slice(0, 10);

                        return { ...oldData, jobs: newJobs };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    if (!shouldShow) return null;

    const mainJob = activeJobs[0];
    // Capitalize first letter
    const statusTitle =
        mainJob.status.charAt(0).toUpperCase() + mainJob.status.slice(1).toLowerCase();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="crawl-indicator"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-[60]"
            >
                {/* Modern Pill Container */}
                <div className="bg-white/90 backdrop-blur-3xl border border-gray-100/50 p-2 pr-5 rounded-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] flex items-center gap-4 transition-all hover:bg-white">
                    
                    {/* Activity Icon Group */}
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff4500] to-[#ff8c00] flex items-center justify-center shadow-[0_4px_12px_rgba(255,69,0,0.3)] relative overflow-hidden group">
                            <Loader2 className="w-5 h-5 text-white animate-spin opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        </div>
                        {/* Status Ring */}
                        <div className="absolute -inset-1 border border-orange-500/20 rounded-full animate-ping [animation-duration:3s]" />
                    </div>
                    
                    {/* Content Section */}
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-900 tracking-widest uppercase opacity-80">
                                {statusTitle}
                            </span>
                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[11px] font-black text-gray-400 tracking-tight truncate max-w-[140px] lowercase">
                            {new URL(mainJob.urls[0]).hostname}
                        </p>
                    </div>

                    {/* Divider and Pips Section */}
                    <div className="h-8 w-[1px] bg-gray-100 ml-1" />
                    
                    <div className="flex items-center gap-1.5 no-scrollbar overflow-hidden">
                        {activeJobs.slice(0, 3).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(255,69,0,0.4)]"
                                style={{ opacity: 1 - (i * 0.25) }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.1 }}
                            />
                        ))}
                        {activeJobs.length > 3 && (
                            <span className="text-[9px] font-black text-orange-600 ml-1 bg-orange-50 px-1.5 py-0.5 rounded-md">
                                +{activeJobs.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
