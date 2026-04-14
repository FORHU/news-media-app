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
    Loader2,
    Send
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';
import Pagination from '@/components/admin/pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

import { Article } from '@/lib/types';
import { Variants } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateArticleModal from '@/components/admin/generatedContent/CreateArticleModal/createArticleModal';
import ReadGeneratedArticle from '@/components/admin/generatedContent/readGeneratedArticle';

import { StoryImage } from '@/components/StoryImage';
import { CATEGORY_HIERARCHY } from '@/lib/categories';

// Mock response type for now, as it might be added to types.ts later
interface GeneratedArticlesResponse {
    articles: Article[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface GeneratedArticleCardProps {
    article: Article;
    variants: Variants;
}

export function GeneratedArticleCard({ article, variants }: GeneratedArticleCardProps) {
    const queryClient = useQueryClient();
    const isPublished = article.status === 'published';
    const publishDate = article.publishDate || article.createdAt;

    const [isReadModalOpen, setIsReadModalOpen] = React.useState(false);

    const publishMutation = useMutation({
        mutationFn: () => articlesApi.publishArticle(article.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
        },
        onError: (error: Error) => {
            alert(`Failed to publish: ${error.message}`);
        }
    });

    return (
        <MotionDiv
            variants={variants}
            whileHover={{ y: -4, scale: 1.005 }}
            className="group relative bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center"
        >

            {/* Thumbnail Image Container */}
            <div className="relative w-full md:w-64 h-48 md:h-44 rounded-[1.5rem] overflow-hidden shadow-inner bg-gray-50 flex-shrink-0">
                <StoryImage
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 256px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#ff4500]/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                    Generated Content
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Article Content Information */}
            <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setIsReadModalOpen(true)}
                        className="text-left group/title focus:outline-none"
                    >
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 leading-tight">
                            {article.title}
                        </h3>
                    </button>
                    <p className="text-gray-500 text-sm line-clamp-2 font-medium leading-relaxed max-w-2xl">
                        {article.content || "No content available for this generated article. Review and edit before publication."}
                    </p>
                </div>

                {/* Meta Badges Row */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{article.category?.categoryName ?? 'Uncategorized'}</span>
                    </div>

                    {isPublished ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <Check className="w-3 h-3 fill-emerald-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">Published</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">Draft / Generated</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-bold tracking-tight">{new Date(publishDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                        <Zap className="w-3 h-3 fill-indigo-600" />
                        <span className="text-xs font-bold uppercase tracking-wider">AI Modified</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0 self-stretch md:self-center justify-center">
                <button
                    type="button"
                    onClick={() => setIsReadModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all group/read"
                >
                    <Newspaper className="w-5 h-5 text-gray-400 group-hover/read:text-gray-900 transition-colors" />
                    Read
                </button>

                <button
                    type="button"
                    onClick={() => publishMutation.mutate()}
                    disabled={isPublished || publishMutation.isPending}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm shadow-lg transition-all group/btn ${isPublished
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                >
                    {publishMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    )}
                    {isPublished ? 'Published' : publishMutation.isPending ? 'Publishing...' : 'Publish Article'}
                </button>

                <ReadGeneratedArticle
                    article={article}
                    open={isReadModalOpen}
                    onOpenChange={setIsReadModalOpen}
                />
            </div>
        </MotionDiv>
    );
}

export default function GeneratedArticlesList({ searchParams }: {
    searchParams: { q?: string; page?: string; date?: string; category?: string }
}) {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const queryClient = useQueryClient();

    const searchQuery = urlSearchParams.get('q') || searchParams.q || '';
    const date = urlSearchParams.get('date') || searchParams.date || '';
    const category = urlSearchParams.get('category') || searchParams.category || '';
    const currentPage = parseInt(urlSearchParams.get('page') || searchParams.page || '1');
    const limit = 10;

    // Use the new API for fetching generated articles
    const { data, isLoading, isError } = useQuery<GeneratedArticlesResponse>({
        queryKey: ['generatedArticles', { searchQuery, currentPage, category, date }],
        queryFn: () => articlesApi.getGeneratedArticles({
            page: currentPage,
            limit,
            q: searchQuery,
            category: category || undefined
        }),
        placeholderData: (prev) => prev,
    });

    const articles = data?.articles || [];
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

    const [searchDraft, setSearchDraft] = React.useState(searchQuery);
    const [categoryDraft, setCategoryDraft] = React.useState(category);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

    React.useEffect(() => {
        setCategoryDraft(category);
    }, [category]);

    React.useEffect(() => {
        setSearchDraft(searchQuery);
    }, [searchQuery]);

    React.useEffect(() => {
        const t = setTimeout(() => {
            if (searchDraft === (searchQuery || '')) return;
            setQueryParams({ q: searchDraft || null });
        }, 400);
        return () => clearTimeout(t);
    }, [searchDraft, searchQuery, setQueryParams]);

    React.useEffect(() => {
        if (categoryDraft === category) return;
        setQueryParams({ category: categoryDraft || null });
    }, [categoryDraft, category, setQueryParams]);

    React.useEffect(() => {
        // Debug: confirms the realtime effect is mounted for this page.
        // eslint-disable-next-line no-console
        console.log('[Realtime] generatedArticlesCard effect mount');

        // If Supabase emits multiple events for the same change burst, throttle
        // so we don't spam the API.
        let lastRefetchAt = 0;
        const throttleMs = 500;

        const refetchFromRealtime = (payload?: any) => {
            const now = Date.now();
            if (now - lastRefetchAt < throttleMs) return;
            lastRefetchAt = now;

            // eslint-disable-next-line no-console
            console.log('[Realtime] generated_articles change:', {
                eventType: payload?.eventType,
                table: payload?.table,
                id: payload?.new?.id ?? payload?.old?.id,
            });

            const isGeneratedArticlesQuery = (q: { queryKey?: unknown }) => {
                return Array.isArray(q.queryKey) && q.queryKey[0] === 'generatedArticles';
            };

            queryClient.invalidateQueries({
                predicate: isGeneratedArticlesQuery,
            });

            void queryClient.refetchQueries({
                predicate: isGeneratedArticlesQuery,
                type: 'active',
            });
        };

        const channel = supabase
            .channel('realtime:generated_articles')
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
                console.log('[Realtime] generated_articles channel status:', status, err ?? null);
                if (status === 'SUBSCRIBED') {
                    void queryClient.refetchQueries({
                        predicate: (q) =>
                            Array.isArray(q.queryKey) && q.queryKey[0] === 'generatedArticles',
                        type: 'active',
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

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
                    Generated <span className="text-orange-600">Content</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg">
                    Review, edit, and publish AI-generated articles to your platform.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sticky top-4 z-10">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                        type="text"
                        placeholder="Search generated articles..."
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        className="h-12 w-full pl-12 pr-4 rounded-2xl bg-gray-50/50 border-gray-100 text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-200 placeholder:text-gray-400"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Select value={categoryDraft || 'All Types'} onValueChange={setCategoryDraft}>
                        <SelectTrigger className="h-12 w-[220px] rounded-2xl bg-gray-50/50 border-gray-100 text-sm font-semibold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px]">
                            <SelectItem value="All Types">All Categories</SelectItem>
                            {CATEGORY_HIERARCHY.map((group) => (
                                <React.Fragment key={group.label}>
                                    <SelectItem value={group.label} className="font-bold text-orange-600">
                                        {group.label} (All)
                                    </SelectItem>
                                    {group.subcategories.map((sub) => (
                                        <SelectItem key={sub} value={sub} className="pl-6 font-medium">
                                            {sub}
                                        </SelectItem>
                                    ))}
                                </React.Fragment>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-12 px-8 rounded-2xl bg-[#ff4500] hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all"
                    >
                        + Create Article
                    </Button>

                    {(searchDraft || (categoryDraft && categoryDraft !== 'All Types')) && (
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="px-0 text-xs font-black uppercase tracking-widest text-[#ff4500] hover:text-orange-600"
                            onClick={() => {
                                setSearchDraft('');
                                setCategoryDraft('All Types');
                                setQueryParams({ q: null, category: null });
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
                    <p className="text-gray-500 font-bold">Loading your content vault...</p>
                </div>
            ) : isError ? (
                <div className="py-32 flex flex-col items-center justify-center bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100 text-red-500">
                    <p className="font-bold text-lg">Failed to load generated articles.</p>
                </div>
            ) : (
                <MotionDiv
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6"
                >
                    {articles && articles.length > 0 ? (
                        articles.map((article: Article) => (
                            <GeneratedArticleCard
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
                            <p className="text-gray-400 font-bold text-lg">Your vault is empty.</p>
                            <p className="text-gray-300 text-sm italic">Generate some articles to see them here.</p>
                        </div>
                    )}
                </MotionDiv>
            )}

            {/* Pagination Segment */}
            {!isLoading && !isError && articles && articles.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={setPage}
                />
            )}

            <CreateArticleModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </div>
    );
}
