"use client";

import React from 'react';
import { 
    Calendar, 
    List, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Loader2,
    Database,
    ExternalLink,
    Globe,
    RefreshCw,
    Settings,
    Trash2,
    ChevronRight,
    Plus,
    Link as LinkIcon
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Pagination from '@/components/admin/pagination';
import { CrawlJob, CrawlJobsResponse } from '@/lib/types';
import { Variants } from 'framer-motion';

const StatusBadge = ({ status }: { status: string }) => {
    const s = status.toLowerCase();
    
    let colorClass = "bg-gray-300 shadow-[0_0_0_3px_rgba(209,213,219,0.15)]";
    let label = status;
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
        colorClass = "bg-gray-300 shadow-[0_0_0_3px_rgba(209,213,219,0.15)]";
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

export default function CrawlJobsTable() {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const queryClient = useQueryClient();
    const currentPage = parseInt(urlSearchParams.get('page') || '1');
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

    const { data, isLoading, isError } = useQuery<CrawlJobsResponse>({
        queryKey: ['crawlJobs', { currentPage }],
        queryFn: () => articlesApi.getCrawlJobs({
            page: currentPage,
            limit: 10
        }),
    });

    const stopMutation = useMutation({
        mutationFn: (jobId: string) => articlesApi.stopCrawlJob(jobId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crawlJobs'] });
        },
        onError: () => {
        }
    });

    const jobs = data?.jobs || [];
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
            <div className="px-10 grid grid-cols-[1.2fr_2fr_1fr_0.8fr] gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">Status</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">URL / Source</span>
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
                    jobs.map((job) => {
                        const isCrawling = ['RUNNING', 'PROCESSING', 'CRAWLING'].includes(job.status.toUpperCase());
                        const isStopping = stopMutation.isPending && (stopMutation.variables === job.id);
                        const isExpanded = expandedIds.has(job.id);
                        const hasMultipleUrls = job.urls.length > 1;

                        return (
                            <MotionDiv
                                key={job.id}
                                variants={itemVariants}
                                onClick={(e) => hasMultipleUrls && toggleExpand(job.id, e)}
                                className={`bg-white rounded-[1.5rem] px-8 py-5 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.08)] transition-all ${hasMultipleUrls ? 'cursor-pointer' : ''}`}
                            >
                                <div className="grid grid-cols-[1.2fr_2fr_1fr_0.8fr] gap-4 items-center">
                                    {/* Status Column */}
                                    <div>
                                        <StatusBadge status={job.status} />
                                    </div>

                                    {/* URL / Source Column */}
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-sm font-bold text-gray-900 truncate">
                                            {new URL(job.urls[0]).hostname}
                                        </span>
                                        {hasMultipleUrls && (
                                            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        )}
                                    </div>

                                    {/* Articles Column */}
                                    <div className="text-right flex flex-col items-end gap-0.5">
                                        <span className="text-sm font-black text-gray-900 leading-none">{job.maxArticlesRequest}</span>
                                        <span className="text-[10px] font-bold text-gray-400 leading-none">
                                            {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Actions Column */}
                                    <div className="flex items-center justify-end gap-1">
                                        <button 
                                            onClick={() => {
                                                queryClient.invalidateQueries({ queryKey: ['crawlJobs'] });
                                            }}
                                            className="p-2 text-[#d1d5db] hover:text-[#ff4500] hover:bg-orange-50 rounded-xl transition-all"
                                            title={isCrawling ? 'Crawling in progress...' : 'Start crawl'}
                                            disabled={isCrawling}
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isCrawling ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button className="p-2 text-[#d1d5db] hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all" title="Settings">
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                stopMutation.mutate(job.id);
                                            }}
                                            disabled={isStopping}
                                            className="p-2 text-[#d1d5db] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">URLs</p>
                                        <div className="space-y-2">
                                            {job.urls.map((url, idx) => (
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
