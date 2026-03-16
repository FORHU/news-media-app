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
    Globe
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Pagination from '@/components/admin/pagination';
import { CrawlJob, CrawlJobsResponse } from '@/lib/types';
import { Variants } from 'framer-motion';

const StatusBadge = ({ status }: { status: string }) => {
    const s = status.toUpperCase();
    
    // Default config (Pending / Unknown)
    let config = {
        icon: Clock,
        colors: "bg-gray-50 text-gray-600 border-gray-100",
        label: status
    };

    if (s === 'SUCCESS' || s === 'DONE') {
        config = {
            icon: CheckCircle2,
            colors: "bg-emerald-50 text-emerald-600 border-emerald-100",
            label: status
        };
    } else if (s === 'FAILED') {
        config = {
            icon: XCircle,
            colors: "bg-red-50 text-red-600 border-red-100",
            label: status
        };
    } else if (s === 'RUNNING' || s === 'PROCESSING' || s === 'CRAWLING') {
        config = {
            icon: Loader2,
            colors: "bg-blue-50 text-blue-600 border-blue-100",
            label: status
        };
    } else if (s === 'STOPPED') {
        config = {
            icon: XCircle,
            colors: "bg-amber-50 text-amber-600 border-amber-100",
            label: status
        };
    }

    const Icon = config.icon;
    const isSpinning = s === 'RUNNING' || s === 'PROCESSING' || s === 'CRAWLING';

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.colors}`}>
            <Icon className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-wider">{config.label}</span>
        </div>
    );
};

export default function CrawlJobsTable() {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const queryClient = useQueryClient();
    const currentPage = parseInt(urlSearchParams.get('page') || '1');

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
    });

    const jobs = data?.jobs || [];
    const pagination = data?.pagination || { totalPages: 0 };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
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
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                        <List className="w-5 h-5 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Recent Crawl Jobs</h2>
                </div>
            </div>

            <MotionDiv 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4"
            >
                {jobs.length > 0 ? (
                    jobs.map((job) => {
                        const canStop = ['RUNNING', 'PROCESSING', 'CRAWLING'].includes(job.status.toUpperCase());
                        const isStopping = stopMutation.isPending && (stopMutation.variables === job.id);

                        return (
                            <MotionDiv
                                key={job.id}
                                variants={itemVariants}
                                whileHover={{ y: -2, scale: 1.002 }}
                                className="bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 border border-gray-100 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center"
                            >
                                <div className="flex-1 space-y-3 w-full">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                <Database className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">Job ID: {job.id.split('-')[0]}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {canStop && (
                                                <button
                                                    onClick={() => stopMutation.mutate(job.id)}
                                                    disabled={isStopping}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 hover:bg-amber-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                                >
                                                    {isStopping ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <XCircle className="w-3.5 h-3.5" />
                                                    )}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {isStopping ? 'Stopping...' : 'Stop Job'}
                                                    </span>
                                                </button>
                                            )}
                                            <StatusBadge status={job.status} />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <a 
                                                href={job.urls[0]} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-sm font-bold text-gray-900 line-clamp-1 hover:text-orange-600 transition-colors flex items-center gap-1.5"
                                            >
                                                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                                                {job.urls[0]}
                                                <ExternalLink className="w-3 h-3 opacity-30" />
                                            </a>
                                            {job.urls.length > 1 && (
                                                <div className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-lg border border-gray-200">
                                                    +{job.urls.length - 1} MORE
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-xs font-medium">{new Date(job.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <Database className="w-3 h-3" />
                                                    {job.maxArticlesRequest} Articles Max
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </MotionDiv>
                        );
                    })
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <List className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold text-lg">No crawl history found.</p>
                        <p className="text-gray-300 text-sm italic">New crawl jobs will appear here once started.</p>
                    </div>
                )}
            </MotionDiv>

            {jobs.length > 0 && (
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
