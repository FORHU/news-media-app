"use client";

import React from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
    RefreshCw,
    StopCircle,
    ChevronRight,
    Link as LinkIcon,
    Loader2
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Pagination from '@/components/admin/pagination';
import { CrawlJob, CrawlJobsResponse } from '@/lib/types';
import { Variants } from 'framer-motion';

const StatusBadge = ({ status }: { status: string }) => {
    const s = (status ?? '').toLowerCase();

    let colorClass = "bg-gray-300 shadow-[0_0_0_3px_rgba(209,213,219,0.15)]";
    let label = status || 'Pending';
    let isCrawling = s === 'crawling' || s === 'running' || s === 'processing';

    if (s === 'successful' || s === 'success' || s === 'done') {
        colorClass = "bg-[#22c55e] shadow-[0_0_0_3px_rgba(34,197,94,0.15)]";
        label = "Successful";
    } else if (s === 'failed') {
        colorClass = "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]";
        label = "Failed";
    } else if (isCrawling) {
        colorClass = "bg-blue-500 animate-pulse shadow-[0_0_0_3px_rgba(59,130,246,0.15)]";
        label = "Crawling";
    } else if (s === 'stopped') {
        colorClass = "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]";
        label = "Stopped";
    }

    return (
        <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorClass}`} />
            <span className="text-sm font-medium text-gray-700">
                {isCrawling && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
                {label}
            </span>
        </div>
    );
};

const CrawlProgressBar = ({ saved, max, isActive }: { saved: number; max: number; isActive?: boolean }) => {
    const pct = max > 0 ? Math.min(100, Math.round((saved / max) * 100)) : 0;
    return (
        <div className="flex flex-col gap-1.5 w-full min-w-0">
            <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs font-bold text-gray-600 tabular-nums">{saved}/{max}</span>
                <span className="text-[10px] font-semibold text-gray-400">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isActive
                            ? 'bg-gradient-to-r from-[#ff4500] to-orange-400'
                            : pct >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : 'bg-gradient-to-r from-gray-300 to-gray-200'
                    } ${isActive ? 'animate-pulse' : ''}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

const getDisplayHost = (urls: string[]) => {
    const first = urls?.[0];
    if (!first) return '—';
    try {
        return new URL(first).hostname;
    } catch {
        return first;
    }
};

export default function CrawlJobsTable() {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const queryClient = useQueryClient();
    const currentPage = parseInt(urlSearchParams.get('page') || '1');
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
    const [stoppingIds, setStoppingIds] = React.useState<Set<string>>(new Set());

    const { data, isLoading, isError } = useQuery<CrawlJobsResponse>({
        queryKey: ['crawlJobs', { currentPage }],
        queryFn: () => articlesApi.getCrawlJobs({
            page: currentPage,
            limit: 10
        }),
    });

    const stopMutation = useMutation({
        mutationFn: (jobId: string) => articlesApi.stopCrawlJob(jobId),
        onMutate: (jobId) => {
            setStoppingIds((prev) => new Set(prev).add(jobId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crawlJobs'] });
        },
        onError: (_, jobId) => {
            setStoppingIds((prev) => {
                const next = new Set(prev);
                next.delete(jobId);
                return next;
            });
        },
    });

    React.useEffect(() => {
        let refetchTimer: ReturnType<typeof setTimeout> | null = null;

        const channel = supabase
            .channel('realtime:crawl_jobs')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'crawl_jobs' },
                (payload: RealtimePostgresChangesPayload<{ id?: string }>) => {
                    try {
                        console.log('[Realtime] crawl_jobs event:', payload.eventType, payload);
                        if (refetchTimer) clearTimeout(refetchTimer);
                        refetchTimer = setTimeout(async () => {
                            refetchTimer = null;
                            try {
                                queryClient.invalidateQueries({ queryKey: ['crawlJobs'] });
                                const results = await queryClient.refetchQueries({ queryKey: ['crawlJobs'] });
                                const first = Array.isArray(results) ? results[0] : results;
                                const fetchedData = (first as { data?: CrawlJobsResponse })?.data;
                                const jobs = fetchedData?.jobs ?? [];
                                console.log('[Realtime] refetch done, jobs count:', jobs.length, 'raw data:', JSON.stringify(fetchedData, null, 2));
                            } catch (err) {
                                console.error('[Realtime] refetch error:', err);
                            }
                        }, 500);

                        if (payload.eventType === 'DELETE') {
                            const deletedId = payload.old?.id;
                            if (deletedId) {
                                setExpandedIds((prev) => {
                                    if (!prev.has(deletedId)) return prev;
                                    const next = new Set(prev);
                                    next.delete(deletedId);
                                    return next;
                                });
                            }
                        }
                    } catch (err) {
                        console.error('[Realtime] callback error:', err);
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('[Realtime] subscription status:', status);
                if (err) console.error('[Realtime] subscription error:', err);
            });

        return () => {
            if (refetchTimer) clearTimeout(refetchTimer);
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const jobs = data?.jobs || [];

    React.useEffect(() => {
        setStoppingIds((prev) => {
            if (prev.size === 0) return prev;
            const next = new Set(prev);
            let changed = false;
            for (const id of next) {
                const job = jobs.find((j) => j.id === id);
                const stillCrawling = job && ['RUNNING', 'PROCESSING', 'CRAWLING'].includes((job.status ?? '').toUpperCase());
                if (!stillCrawling) {
                    next.delete(id);
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [jobs]);

    const pagination = data?.pagination || { totalPages: 0 };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 10, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 150,
                damping: 20
            }
        }
    };

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <Loader2 className="w-10 h-10 text-[#ff4500] animate-spin mb-4" />
                <p className="text-gray-500 font-bold">Scanning crawl history...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-20 flex flex-col items-center justify-center bg-red-50 rounded-[2.5rem] border border-dashed border-red-100 text-red-500">
                <p className="font-bold text-lg">Failed to load crawl history.</p>
                <p className="text-sm italic">Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 px-2">Recent Crawl Jobs</h2>

            {/* Table Header Wrapper */}
            <div className="px-10 grid grid-cols-[1.2fr_2fr_1.5fr_1fr_0.8fr] gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">Status</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">URL / Source</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">Progress</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] text-right">Articles</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] text-right">Actions</span>
            </div>

            <MotionDiv
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
            >
                {jobs.length > 0 ? (
                    jobs.filter((job) => job?.id).map((job) => {
                        const isCrawling = ['RUNNING', 'PROCESSING', 'CRAWLING'].includes((job.status ?? '').toUpperCase());
                        const isStopping = stoppingIds.has(job.id);
                        const isExpanded = expandedIds.has(job.id);
                        const hasMultipleUrls = (job.urls?.length ?? 0) > 1;

                        return (
                            <MotionDiv
                                key={job.id}
                                variants={itemVariants}
                                initial={false}
                                onClick={(e) => hasMultipleUrls && toggleExpand(job.id, e)}
                                className={`bg-white rounded-[1.5rem] px-8 py-5 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.08)] transition-all ${hasMultipleUrls ? 'cursor-pointer' : ''}`}
                            >
                                <div className="grid grid-cols-[1.2fr_2fr_1.5fr_1fr_0.8fr] gap-4 items-center">
                                    {/* Status Column */}
                                    <div>
                                        <StatusBadge status={job.status} />
                                    </div>

                                    {/* URL / Source Column */}
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-sm font-bold text-gray-900 truncate">
                                            {getDisplayHost(job.urls ?? [])}
                                        </span>
                                        {hasMultipleUrls && (
                                            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        )}
                                    </div>

                                    {/* Progress Column */}
                                    <div className="min-w-0">
                                        <CrawlProgressBar
                                            saved={job.articlesSaved ?? 0}
                                            max={job.maxArticlesRequest ?? 0}
                                            isActive={isCrawling}
                                        />
                                    </div>

                                    {/* Articles Column */}
                                    <div className="text-right flex flex-col items-end gap-0.5">
                                        <span className="text-sm font-black text-gray-900 leading-none">{job.maxArticlesRequest ?? 0}</span>
                                        <span className="text-[10px] font-bold text-gray-400 leading-none">
                                            {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : '—'}
                                        </span>
                                    </div>

                                    {/* Actions Column */}
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                queryClient.invalidateQueries({ queryKey: ['crawlJobs'] });
                                            }}
                                            className="p-2 text-[#d1d5db] hover:text-[#ff4500] hover:bg-orange-50 rounded-xl transition-all"
                                            title={isCrawling ? 'Crawling in progress...' : 'Refresh'}
                                            disabled={isCrawling}
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isCrawling ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                stopMutation.mutate(job.id);
                                            }}
                                            disabled={!isCrawling || isStopping}
                                            title={isStopping ? 'Stopping...' : 'Stop crawl'}
                                            className={`p-2 rounded-xl transition-all disabled:opacity-40 ${isCrawling ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-[#d1d5db] hover:text-red-500 hover:bg-red-50'}`}
                                        >
                                            {isStopping ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <StopCircle className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">URLs</p>
                                        <div className="space-y-2">
                                                {(job.urls ?? []).map((url, idx) => (
                                                <div key={idx} className="flex items-center gap-3 text-xs text-gray-500 group/url">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                                    <a href={url} target="_blank" rel="noreferrer" className="hover:text-[#ff4500] hover:underline transition-all">
                                                        {url}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </MotionDiv>
                        );
                    })
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm shadow-gray-100/50">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <LinkIcon className="w-8 h-8 text-[#d1d5db]" />
                        </div>
                        <p className="text-[#4b5563] font-bold text-lg">No crawl jobs yet</p>
                        <p className="text-[#9ca3af] text-sm italic">Start your first crawl to generate AI-powered content</p>
                    </div>
                )}
            </MotionDiv>

            {jobs.length > 0 && (pagination.totalPages > 1) && (
                <div className="pt-4">
                    <Pagination
                        totalPages={pagination.totalPages}
                        currentPage={currentPage}
                    />
                </div>
            )}
        </div>
    );
}
