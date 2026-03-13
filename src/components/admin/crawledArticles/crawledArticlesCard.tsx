"use client";

import React from 'react';
import Image from 'next/image';
import { 
    Globe, 
    ExternalLink, 
    Calendar, 
    Zap, 
    Check,
    Search,
    Newspaper,
    Loader2
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';
import NavigatingDropdown from '@/components/admin/NavigatingDropdown';
import Pagination from '@/components/admin/pagination';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { MappedRawArticle, CrawledArticlesResponse } from '@/lib/types';
import { Variants } from 'framer-motion';

interface CrawledArticleCardProps {
    article: MappedRawArticle;
    variants: Variants;
}

export function CrawledArticleCard({ article, variants }: CrawledArticleCardProps) {
    const isGenerated = !!article.contentArticle;
    const publishDate = article.publishDate || article.createdAt;

    // Normalize image URL to avoid passing empty/invalid values to next/image (fixes picomatch "Expected a non-empty string")
    const rawImage = article.imageUrl ?? '';
    const imageUrl = typeof rawImage === 'string' ? rawImage.trim() : '';
    const hasValidImage = imageUrl.length > 0 && imageUrl.startsWith('http');

    return (
        <MotionDiv
            variants={variants}
            whileHover={{ y: -4, scale: 1.005 }}
            className="group relative bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center"
        >

            {/* Thumbnail Image Container */}
            <div className="relative w-full md:w-64 h-48 md:h-44 rounded-[1.5rem] overflow-hidden shadow-inner bg-gray-50 flex-shrink-0">
                {hasValidImage ? (
                    <Image 
                        src={imageUrl} 
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 capitalize text-4xl font-black text-gray-200">
                        {article.title.charAt(0)}
                    </div>
                )}
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                    news
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Article Content Information */}
            <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                        {article.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 font-medium leading-relaxed max-w-2xl">
                        {article.content || "No excerpt available for this intelligence report. Review the source content for full details."}
                    </p>
                </div>

                {/* Meta Badges Row */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{article.category?.categoryName ?? 'Uncategorized'}</span>
                    </div>

                    {isGenerated ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <Zap className="w-3 h-3 fill-emerald-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">Generated</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                        </div>
                    )}

                    {article.crawledUrl?.url ? (
                        <a 
                            href={article.crawledUrl.url} 
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 hover:bg-blue-600 hover:text-white transition-all group/link shadow-sm"
                        >
                            <Globe className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase tracking-wider">Source</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/link:opacity-100 -translate-x-1 group-hover/link:translate-x-0 transition-all" />
                        </a>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                            <Globe className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase tracking-wider">Source</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-bold tracking-tight">{new Date(publishDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full md:w-auto flex flex-col gap-2 flex-shrink-0 self-stretch md:self-center justify-center">
                <button className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all group/btn">
                    <Zap className="w-5 h-5 group-hover:animate-pulse" />
                    Generate
                </button>
            </div>
        </MotionDiv>
    );
}

// Minimal shell to handle React Query and interactive UI
export default function CrawledArticlesList({ searchParams }: { 
    searchParams: { source?: string; date?: string; q?: string; page?: string } 
}) {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();

    const filterSource = searchParams.source || 'All Sources';
    const filterDate = searchParams.date || 'Today';
    const searchQuery = searchParams.q || '';
    const currentPage = parseInt(searchParams.page || '1');

    const { data, isLoading, isError } = useQuery<CrawledArticlesResponse>({
        queryKey: ['crawledArticles', { filterSource, filterDate, searchQuery, currentPage }],
        queryFn: () => articlesApi.getCrawledArticles({
            source: filterSource,
            date: filterDate,
            q: searchQuery,
            page: currentPage,
            limit: 10
        }),
    });

    const articles = data?.articles || [];
    const sources = data?.sources || ['All Sources'];
    const pagination = data?.pagination || { totalPages: 0 };

    const handleSearch = (q: string) => {
        const params = new URLSearchParams(urlSearchParams.toString());
        if (q) {
            params.set('q', q);
        } else {
            params.delete('q');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

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
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Crawled <span className="text-orange-600">Articles</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg">
                    Discover and transform automated intelligence into premium news content.
                </p>
            </div>

            {/* Premium Filter Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sticky top-4 z-10">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search intelligence..."
                        defaultValue={searchQuery}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch((e.target as HTMLInputElement).value);
                            }
                        }}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-200 outline-none transition-all placeholder:text-gray-400"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <NavigatingDropdown
                        options={sources}
                        value={filterSource}
                        paramName="source"
                        icon={<Globe className="w-4 h-4" />}
                        className="flex-1 md:flex-none md:w-48 !rounded-2xl !py-3.5"
                    />

                    <NavigatingDropdown
                        options={['Today', 'Last 7 Days', 'This Month']}
                        value={filterDate}
                        paramName="date"
                        icon={<Calendar className="w-4 h-4" />}
                        className="flex-1 md:flex-none md:w-48 !rounded-2xl !py-3.5"
                    />
                </div>
            </div>

            {/* Grid of Article Cards */}
            {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-bold">Scanning the intelligence horizon...</p>
                </div>
            ) : isError ? (
                <div className="py-32 flex flex-col items-center justify-center bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100 text-red-500">
                    <p className="font-bold text-lg">Failed to load intelligence.</p>
                    <p className="text-sm italic">Please check your connection or try again later.</p>
                </div>
            ) : (
                <MotionDiv 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6"
                >
                    {articles.length > 0 ? (
                        articles.map((article: MappedRawArticle) => (
                            <CrawledArticleCard 
                                key={article.id} 
                                article={article} 
                                variants={itemVariants} 
                            />
                        ))
                    ) : (
                        <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Newspaper className="w-10 h-10 text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-bold text-lg">No intelligence discovered yet.</p>
                            <p className="text-gray-300 text-sm italic">The crawler is scanning the horizon for fresh news...</p>
                        </div>
                    )}
                </MotionDiv>
            )}

            {/* Pagination Segment */}
            {!isLoading && !isError && (
                <Pagination 
                    totalPages={pagination?.totalPages || 0} 
                    currentPage={currentPage} 
                />
            )}
        </div>
    );
}