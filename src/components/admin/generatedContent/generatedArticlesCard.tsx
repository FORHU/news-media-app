"use client";

import React from 'react';
import Image from 'next/image';
import {
    Globe,
    Youtube,
    Twitter,
    Upload,
    PenLine,
    ExternalLink,
    Calendar,
    Zap,
    Check,
    Search,
    Newspaper,
    Loader2,
    Send,
    EyeOff
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';
import Pagination from '@/components/admin/pagination';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import PublishArticleModal from '@/components/admin/generatedContent/PublishArticleModal';

import { StoryImage } from '@/components/StoryImage';
import ConfirmationModal from '@/components/admin/shared/ConfirmationModal';
import { normalizeCategoryName } from '@/lib/categoryDisplay';

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

const ALL_CATEGORIES_VALUE = '__all_categories__';
const ALL_STATUS_VALUE = '__all_status__';

interface GeneratedArticleCardProps {
    article: Article;
    variants: Variants;
}

function getSourceMeta(sourceType?: string | null) {
    switch (sourceType) {
        case 'VIDEO':
            return { label: 'YouTube', Icon: Youtube, className: 'bg-red-50 text-red-600 border-red-100' };
        case 'TWEET':
            return { label: 'X', Icon: Twitter, className: 'bg-gray-900 text-white border-gray-800' };
        case 'UPLOAD':
            return { label: 'Upload', Icon: Upload, className: 'bg-violet-50 text-violet-600 border-violet-100' };
        case 'MANUAL':
            return { label: 'Manual', Icon: PenLine, className: 'bg-gray-50 text-gray-600 border-gray-100' };
        case 'ARTICLE':
        default:
            return { label: 'Website', Icon: Globe, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
}

export function GeneratedArticleCard({ article, variants }: GeneratedArticleCardProps) {
    const isPublished = article.status === 'published';
    const publishDate = article.publishDate || article.createdAt;

    const [isReadModalOpen, setIsReadModalOpen] = React.useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
    const [isUnpublishing, setIsUnpublishing] = React.useState(false);
    const queryClient = useQueryClient();

    const handleUnpublishClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmModalOpen(true);
    };

    const handleUnpublishConfirm = async () => {
        setIsUnpublishing(true);
        try {
            await articlesApi.unpublishArticle(article.id);
            // Realtime should handle it, but we invalidate for immediate feedback
            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
            setIsConfirmModalOpen(false);
        } catch (error) {
            console.error('Failed to unpublish article:', error);
            alert('Failed to unpublish article. Please try again.');
        } finally {
            setIsUnpublishing(false);
        }
    };

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
                    {normalizeCategoryName(article.category?.categoryName) ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span className="text-xs font-bold text-gray-600">
                                {normalizeCategoryName(article.category?.categoryName)}
                            </span>
                        </div>
                    ) : null}

                    {(() => {
                        const meta = getSourceMeta((article as any).sourceType);
                        const Icon = meta.Icon;
                        return (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${meta.className}`}>
                                <Icon className="w-3 h-3" />
                                <span className="text-xs font-bold uppercase tracking-wider">{meta.label}</span>
                            </div>
                        );
                    })()}

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

                {isPublished ? (
                    <button
                        type="button"
                        onClick={handleUnpublishClick}
                        disabled={isUnpublishing}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 hover:scale-[1.02] active:scale-[0.98] shadow-sm transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUnpublishing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <EyeOff className="w-5 h-5 text-red-400 group-hover/btn:text-red-600 transition-colors" />
                        )}
                        Unpublish Article
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsPublishModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all group/btn"
                    >
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Publish Article
                    </button>
                )}

                <ReadGeneratedArticle
                    article={article}
                    open={isReadModalOpen}
                    onOpenChange={setIsReadModalOpen}
                />

                <PublishArticleModal
                    article={article}
                    open={isPublishModalOpen}
                    onOpenChange={setIsPublishModalOpen}
                />

                <ConfirmationModal 
                    isOpen={isConfirmModalOpen}
                    onOpenChange={setIsConfirmModalOpen}
                    onConfirm={handleUnpublishConfirm}
                    title="Unpublish Article?"
                    description="This will remove the article from the public site and move it back to pending status. You can edit and republish it later."
                    confirmText="Yes, Unpublish"
                    variant="warning"
                    isLoading={isUnpublishing}
                />
            </div>
        </MotionDiv>
    );
}

export default function GeneratedArticlesList({ searchParams }: {
    searchParams: { q?: string; page?: string; date?: string; category?: string; status?: string }
}) {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const queryClient = useQueryClient();

    const searchQuery = urlSearchParams.get('q') || searchParams.q || '';
    const date = urlSearchParams.get('date') || searchParams.date || '';
    const category = urlSearchParams.get('category') || searchParams.category || '';
    const status = urlSearchParams.get('status') || searchParams.status || '';
    const currentPage = parseInt(urlSearchParams.get('page') || searchParams.page || '1');
    const limit = 10;

    // Use the new API for fetching generated articles
    const { data, isLoading, isError } = useQuery<GeneratedArticlesResponse>({
        queryKey: ['generatedArticles', { searchQuery, currentPage, category, date, status }],
        queryFn: () => articlesApi.getGeneratedArticles({
            page: currentPage,
            limit,
            q: searchQuery,
            category: category || undefined,
            status: status || undefined
        }),
        placeholderData: (prev) => prev,
    });
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => articlesApi.getCategories(),
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
    const [statusDraft, setStatusDraft] = React.useState(status);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

    React.useEffect(() => {
        setCategoryDraft(category);
    }, [category]);

    React.useEffect(() => {
        setStatusDraft(status);
    }, [status]);

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
        if (statusDraft === status) return;
        setQueryParams({ status: statusDraft || null });
    }, [statusDraft, status, setQueryParams]);

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
                    <Select
                        value={categoryDraft || ALL_CATEGORIES_VALUE}
                        onValueChange={(value) =>
                            setCategoryDraft(value === ALL_CATEGORIES_VALUE ? '' : value)
                        }
                    >
                        <SelectTrigger className="h-12 w-[180px] rounded-2xl bg-gray-50/50 border-gray-100 text-sm font-semibold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px]">
                            <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
                            {(categories ?? []).map((cat) => (
                                <SelectItem key={cat.id} value={cat.name} className="font-medium">
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={statusDraft || ALL_STATUS_VALUE}
                        onValueChange={(value) =>
                            setStatusDraft(value === ALL_STATUS_VALUE ? '' : value)
                        }
                    >
                        <SelectTrigger className="h-12 w-[160px] rounded-2xl bg-gray-50/50 border-gray-100 text-sm font-semibold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUS_VALUE}>All Status</SelectItem>
                            <SelectItem value="Published" className="font-medium">Published</SelectItem>
                            <SelectItem value="Pending" className="font-medium">Pending</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-12 px-8 rounded-2xl bg-[#ff4500] hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all"
                    >
                        + Create Article
                    </Button>

                    {(searchDraft || categoryDraft || statusDraft) && (
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="px-0 text-xs font-black uppercase tracking-widest text-[#ff4500] hover:text-orange-600"
                            onClick={() => {
                                setSearchDraft('');
                                setCategoryDraft('');
                                setStatusDraft('');
                                setQueryParams({ q: null, category: null, status: null });
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
