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
import Pagination from '@/components/admin/pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

import { MappedRawArticle, CrawledArticlesResponse } from '@/lib/types';
import { Variants } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';

interface CrawledArticleCardProps {
    article: MappedRawArticle;
    variants: Variants;
}

export function CrawledArticleCard({ article, variants }: CrawledArticleCardProps) {
    const isGenerated = !!article.contentArticle;
    const publishDate = article.publishDate || article.createdAt;

    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: () => articlesApi.generateAiContent(article.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crawledArticles'] });
        },
    });

    // Normalize image URL to avoid passing empty strings to next/image
    const rawImage = article.imageUrl ?? '';
    const imageUrl = typeof rawImage === 'string' ? rawImage.trim() : '';

    return (
        <MotionDiv
            variants={variants}
            whileHover={{ y: -4, scale: 1.005 }}
            className="group relative bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center"
        >

            {/* Thumbnail Image Container */}
            <div className="relative w-full md:w-64 h-48 md:h-44 rounded-[1.5rem] overflow-hidden shadow-inner bg-gray-50 flex-shrink-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 256px"
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
                        {article.content || "No excerpt available for this article. Review the source content for full details."}
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
                <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={isGenerated || mutation.isPending}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm shadow-lg transition-all group/btn ${isGenerated || mutation.isPending
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                >
                    {mutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isGenerated ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <Zap className="w-5 h-5 group-hover:animate-pulse" />
                    )}
                    {mutation.isPending ? 'Generating...' : isGenerated ? 'Generated' : 'Generate'}
                </button>
            </div>
        </MotionDiv>
    );
}

// Minimal shell to handle React Query and interactive UI
export default function CrawledArticlesList({ searchParams }: {
    searchParams: { from?: string; to?: string; q?: string; page?: string; source?: string; date?: string }
}) {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const queryClient = useQueryClient();

    const from = urlSearchParams.get('from') || searchParams.from || '';
    const to = urlSearchParams.get('to') || searchParams.to || '';
    const searchQuery = urlSearchParams.get('q') || searchParams.q || '';
    const source = urlSearchParams.get('source') || searchParams.source || '';
    const date = urlSearchParams.get('date') || searchParams.date || '';
    const currentPage = parseInt(urlSearchParams.get('page') || searchParams.page || '1');
    const limit = 10;

    const { data, isLoading, isError } = useQuery<CrawledArticlesResponse>({
        queryKey: ['crawledArticles', { from, to, searchQuery, currentPage, source, date }],
        queryFn: () => articlesApi.getCrawledArticles({
            from: from || undefined,
            to: to || undefined,
            source: source || undefined,
            date: date || undefined,
            q: searchQuery,
            page: currentPage,
            limit
        }),
        placeholderData: (prev) => prev,
        staleTime: 0,
        // Event-driven: Supabase realtime should cause a refetch.
    });

    const articles = data?.articles || [];
    const sources = data?.sources || ['All Sources'];
    const pagination = data?.pagination || { totalPages: 0 };

    const setPage = React.useCallback((page: number) => {
        const totalPagesVal = pagination?.totalPages || 0;
        const nextPage = Math.max(1, Math.min(page, Math.max(1, totalPagesVal || 1)));
        const params = new URLSearchParams(urlSearchParams.toString());
        params.set('page', String(nextPage));
        router.push(`${pathname}?${params.toString()}`);
    }, [pagination?.totalPages, pathname, router, urlSearchParams]);

    const setQueryParams = React.useCallback(
        (updates: Record<string, string | null | undefined>) => {
            const params = new URLSearchParams(urlSearchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value == null || value === '') params.delete(key);
                else params.set(key, value);
            }
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
        },
        [pathname, router, urlSearchParams]
    );

    const toLocalISODate = (value: string | Date | null | undefined) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const [searchDraft, setSearchDraft] = React.useState(searchQuery);
    const [sourceDraft, setSourceDraft] = React.useState(source);
    const [rangeDraft, setRangeDraft] = React.useState<{ from: string; to: string }>({
        from,
        to,
    });

    React.useEffect(() => {
        setSearchDraft(searchQuery);
    }, [searchQuery]);

    React.useEffect(() => {
        setRangeDraft({ from, to });
    }, [from, to]);

    React.useEffect(() => {
        setSourceDraft(source);
    }, [source]);

    React.useEffect(() => {
        // Debug: confirms the realtime effect is mounted for this page.
        // eslint-disable-next-line no-console
        console.log('[Realtime] crawledArticlesCard effect mount');

        // If Supabase emits multiple events for the same change burst, throttle
        // so we don't spam the API.
        let lastRefetchAt = 0;
        const throttleMs = 500;

        const refetchFromRealtime = (payload?: any) => {
            const now = Date.now();
            if (now - lastRefetchAt < throttleMs) return;
            lastRefetchAt = now;

            // eslint-disable-next-line no-console
            console.log('[Realtime] crawled_articles change:', {
                eventType: payload?.eventType,
                table: payload?.table,
                id: payload?.new?.id ?? payload?.old?.id,
            });

            const isCrawledArticlesQuery = (q: { queryKey?: unknown }) => {
                return Array.isArray(q.queryKey) && q.queryKey[0] === 'crawledArticles';
            };

            queryClient.invalidateQueries({
                predicate: isCrawledArticlesQuery,
            });

            void queryClient.refetchQueries({
                predicate: isCrawledArticlesQuery,
                type: 'active',
            });
        };

        const channel = supabase
            .channel('realtime:crawled_articles')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'raw_articles' },
                refetchFromRealtime
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'content_articles' },
                refetchFromRealtime
            )
            .subscribe((status, err) => {
                // eslint-disable-next-line no-console
                console.log('[Realtime] crawled_articles channel status:', status, err ?? null);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    React.useEffect(() => {
        const t = setTimeout(() => {
            if (searchDraft === (searchQuery || '')) return;
            setQueryParams({ q: searchDraft || null });
        }, 400);
        return () => clearTimeout(t);
    }, [searchDraft, searchQuery, setQueryParams]);

    React.useEffect(() => {
        const t = setTimeout(() => {
            if (rangeDraft.from === from && rangeDraft.to === to) return;
            setQueryParams({
                from: rangeDraft.from || null,
                to: rangeDraft.to || null,
            });
        }, 350);
        return () => clearTimeout(t);
    }, [from, rangeDraft.from, rangeDraft.to, setQueryParams, to]);

    React.useEffect(() => {
        if (sourceDraft === source) return;
        setQueryParams({ source: sourceDraft || null });
    }, [sourceDraft, source, setQueryParams]);

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
                    Discover and transform automated crawls into premium news content.
                </p>
            </div>

            {/* Premium Filter Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sticky top-4 z-10">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                        type="text"
                        placeholder="Search articles..."
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        className="h-12 w-full pl-12 pr-4 rounded-2xl bg-gray-50/50 border-gray-100 text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-200 placeholder:text-gray-400"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Select value={sourceDraft || 'All Sources'} onValueChange={setSourceDraft}>
                        <SelectTrigger className="h-12 w-[180px] rounded-2xl bg-gray-50/50 border-gray-100 text-sm font-semibold text-gray-900 focus-visible:ring-orange-500/20">
                            <SelectValue placeholder="All Sources" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {sources.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 flex-1 md:flex-none md:w-[320px] justify-start rounded-2xl border-gray-100 bg-gray-50/50 text-left text-sm font-semibold text-gray-900 hover:bg-white"
                            >
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                {rangeDraft.from && rangeDraft.to
                                    ? `${format(new Date(rangeDraft.from), "MMM d, yyyy")} – ${format(new Date(rangeDraft.to), "MMM d, yyyy")}`
                                    : rangeDraft.from
                                        ? `${format(new Date(rangeDraft.from), "MMM d, yyyy")} – …`
                                        : rangeDraft.to
                                            ? `… – ${format(new Date(rangeDraft.to), "MMM d, yyyy")}`
                                            : <span className="text-gray-400 font-semibold">Pick a date range</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="end">
                            <ShadCalendar
                                mode="range"
                                numberOfMonths={2}
                                selected={{
                                    from: rangeDraft.from ? new Date(rangeDraft.from) : undefined,
                                    to: rangeDraft.to ? new Date(rangeDraft.to) : undefined,
                                }}
                                onSelect={(range) => {
                                    setRangeDraft({
                                        from: range?.from ? toLocalISODate(range.from) : '',
                                        to: range?.to ? toLocalISODate(range.to) : '',
                                    })
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {((rangeDraft.from || rangeDraft.to) || searchDraft || (sourceDraft && sourceDraft !== 'All Sources')) && (
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="px-0 text-xs font-black uppercase tracking-widest text-[#ff4500] hover:text-orange-600"
                            onClick={() => {
                                setRangeDraft({ from: '', to: '' });
                                setSearchDraft('');
                                setSourceDraft('All Sources');
                                setQueryParams({ from: null, to: null, q: null, source: null });
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Grid of Article Cards */}
            {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-bold">Scanning the horizon...</p>
                </div>
            ) : isError ? (
                <div className="py-32 flex flex-col items-center justify-center bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100 text-red-500">
                    <p className="font-bold text-lg">Failed to load articles.</p>
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
                            <p className="text-gray-400 font-bold text-lg">No articles discovered yet.</p>
                            <p className="text-gray-300 text-sm italic">The crawler is scanning the horizon for fresh news...</p>
                        </div>
                    )}
                </MotionDiv>
            )}

            {/* Pagination Segment */}
            {!isLoading && !isError && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}
