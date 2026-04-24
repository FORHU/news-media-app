"use client";

import React, { useState } from 'react';
import {
    Youtube,
    History,
    Loader2,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/admin/pagination';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function TranscribeHistory() {
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const historyRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (searchParams?.get('view') === 'history') {
            historyRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [searchParams]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Fetch history
    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['generatedArticles', 'youtube', currentPage],
        queryFn: () => articlesApi.getGeneratedArticles({
            page: currentPage,
            limit: limit,
            status: 'all'
        }),
    });

    const youtubeHistory = historyData?.articles.filter(a => a.youtubeUrl) || [];

    return (
        <div ref={historyRef} className="space-y-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-gray-100 h-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <History className="w-6 h-6 text-gray-400" />
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent History</h2>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push('/admin/dashboard/generated')}
                        className="text-xs font-bold text-gray-500 hover:text-red-600"
                    >
                        View All
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>

                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-red-200 animate-spin" />
                        <p className="text-sm font-bold text-gray-400">Loading history...</p>
                    </div>
                ) : youtubeHistory.length > 0 ? (
                    <div className="space-y-4">
                        {youtubeHistory.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="group p-4 bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow-md hover:border-red-100 transition-all cursor-pointer"
                                onClick={() => router.push(`/admin/dashboard/generated?id=${item.id}`)}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            item.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                        }`}>
                                            {item.status}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                                            <Youtube className="w-3 h-3 text-red-600" />
                                        </div>
                                        <span className="text-[10px] font-medium text-gray-400 truncate max-w-[200px]">
                                            {item.youtubeUrl}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        <div className="pt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={historyData?.pagination.totalPages || 1}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <History className="w-8 h-8 text-gray-200" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No YouTube History</h3>
                        <p className="text-sm text-gray-400 font-medium">Your generated articles from YouTube will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
