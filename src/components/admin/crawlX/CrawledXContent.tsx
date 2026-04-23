"use client";

import React from 'react';
import {
    Twitter,
    ExternalLink,
    Calendar,
    Zap,
    Search,
    Loader2,
    MessageSquare,
    Heart,
    Repeat2
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';
import Pagination from '@/components/admin/pagination';
import { useQuery } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Variants } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Mock type for X content since we don't have the real one yet
interface XContent {
    id: string;
    handle: string;
    authorName: string;
    content: string;
    postedAt: string;
    likes: number;
    retweets: number;
    replies: number;
    url: string;
    avatarUrl?: string;
}

export function XContentCard({ item, variants }: { item: XContent; variants: Variants }) {
    return (
        <MotionDiv
            variants={variants}
            whileHover={{ y: -4, scale: 1.005 }}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-blue-200/20 border border-gray-100 transition-all duration-300 flex flex-col gap-4"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-blue-100">
                        {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt={item.authorName} className="w-full h-full object-cover" />
                        ) : (
                            <Twitter className="w-6 h-6 text-blue-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight">{item.authorName}</h3>
                        <p className="text-sm text-blue-500 font-medium">@{item.handle}</p>
                    </div>
                </div>
                <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                {item.content}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 text-gray-400 group/metric">
                        <MessageSquare className="w-4 h-4 group-hover/metric:text-blue-500 transition-colors" />
                        <span className="text-xs font-bold">{item.replies}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 group/metric">
                        <Repeat2 className="w-4 h-4 group-hover/metric:text-green-500 transition-colors" />
                        <span className="text-xs font-bold">{item.retweets}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 group/metric">
                        <Heart className="w-4 h-4 group-hover/metric:text-red-500 transition-colors" />
                        <span className="text-xs font-bold">{item.likes}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-bold tracking-tight">
                            {format(new Date(item.postedAt), 'MMM d, yyyy')}
                        </span>
                    </div>
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-md hover:shadow-blue-500/30"
                    >
                        <Zap className="w-4 h-4 mr-1.5 fill-white" />
                        Generate Article
                    </Button>
                </div>
            </div>
        </MotionDiv>
    );
}

export default function CrawledXContent() {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();

    const searchQuery = urlSearchParams.get('q') || '';
    const currentPage = parseInt(urlSearchParams.get('page') || '1');

    // Placeholder for real data fetching
    const items: XContent[] = [];

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

    return (
        <div className="space-y-8 min-h-screen pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Crawled <span className="text-blue-500">X Content</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg">
                    Monitor and transform X posts into premium news articles.
                </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sticky top-4 z-10">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        type="text"
                        placeholder="Search X content..."
                        value={searchQuery}
                        onChange={(e) => {
                            const params = new URLSearchParams(urlSearchParams.toString());
                            params.set('q', e.target.value);
                            router.push(`${pathname}?${params.toString()}`);
                        }}
                        className="h-12 w-full pl-12 pr-4 rounded-2xl bg-gray-50/50 border-gray-100 text-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-200 placeholder:text-gray-400"
                    />
                </div>
            </div>

            <MotionDiv
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6"
            >
                {items.length > 0 ? (
                    items.map((item) => (
                        <XContentCard
                            key={item.id}
                            item={item}
                            variants={itemVariants}
                        />
                    ))
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <Twitter className="w-10 h-10 text-blue-200" />
                        </div>
                        <p className="text-gray-400 font-bold text-lg">No X content discovered yet.</p>
                        <p className="text-gray-300 text-sm italic">The crawler is monitoring X for fresh insights...</p>
                    </div>
                )}
            </MotionDiv>


            <div className="pt-8">
                <Pagination
                    currentPage={currentPage}
                    totalPages={1}
                    onPageChange={(page) => {
                        const params = new URLSearchParams(urlSearchParams.toString());
                        params.set('page', String(page));
                        router.push(`${pathname}?${params.toString()}`);
                    }}
                />
            </div>
        </div>
    );
}
