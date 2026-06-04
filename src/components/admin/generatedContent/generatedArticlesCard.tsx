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
    EyeOff,
    Trash2,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Pagination from '@/components/admin/pagination';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Article } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateArticleModal from '@/components/admin/generatedContent/CreateArticleModal/createArticleModal';
import ArticleEditorModal from '@/components/admin/generatedContent/ArticleEditorModal';

import { StoryImage } from '@/components/StoryImage';
import ConfirmationModal from '@/components/admin/shared/ConfirmationModal';
import { getCategoryLabel } from '@/config/categories';
import { normalizeCategoryName } from '@/lib/categoryDisplay';
import { useArticleStream } from '@/hooks/useArticleStream';

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

    const [isEditorModalOpen, setIsEditorModalOpen] = React.useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
    const [isUnpublishing, setIsUnpublishing] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isDeletedLocally, setIsDeletedLocally] = React.useState(false);
    const [isHeadline, setIsHeadline] = React.useState(article.isHeadline ?? false);
    const [isUpdatingHeadline, setIsUpdatingHeadline] = React.useState(false);
    const [isHeadlineConfirmOpen, setIsHeadlineConfirmOpen] = React.useState(false);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        setIsHeadline(article.isHeadline ?? false);
    }, [article.isHeadline]);

    const handleUnpublishClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmModalOpen(true);
    };

    const handleUnpublishConfirm = async () => {
        setIsUnpublishing(true);
        try {
            await articlesApi.unpublishArticle(article.id);
            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
            setIsConfirmModalOpen(false);
        } catch (error) {
            console.error('Failed to unpublish article:', error);
            alert('Failed to unpublish article. Please try again.');
        } finally {
            setIsUnpublishing(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await articlesApi.deleteGeneratedArticle(article.id);
            setIsDeletedLocally(true);
            queryClient.invalidateQueries({ queryKey: ['generatedArticles'] });
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Failed to delete article:', error);
            alert('Failed to delete article. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleHeadlineToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isUpdatingHeadline) return;
        setIsHeadlineConfirmOpen(true);
    };

    const handleHeadlineConfirm = async () => {
        const newVal = !isHeadline;

        // Close modal immediately and show loading on the button
        setIsHeadlineConfirmOpen(false);
        setIsUpdatingHeadline(true);

        try {
            await articlesApi.updateArticle(article.id, { isHeadline: newVal });

            // Update local state only after successful API call
            setIsHeadline(newVal);

            // Invalidate in background to sync other cards
            queryClient.invalidateQueries({
                queryKey: ['generatedArticles']
            });
        } catch (error) {
            console.error('Failed to update headline status:', error);
            alert('Failed to update headline status. Please try again.');
        } finally {
            setIsUpdatingHeadline(false);
        }
    };

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -4, scale: 1.002 }}
            className={`group relative bg-white rounded-[1.5rem] p-3.5 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 border border-gray-100 transition-all duration-300 flex flex-col md:flex-row gap-5 items-start md:items-center ${isDeletedLocally ? 'hidden' : ''}`}
        >

            {/* Thumbnail Image Container */}
            <div className="relative w-full md:w-56 h-36 md:h-32 rounded-[1.2rem] overflow-hidden shadow-inner bg-gray-50 flex-shrink-0">
                <StoryImage
                    src={article.imageUrl || article.rawArticle?.imageUrl}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 256px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* HIGH VISIBILITY HEADLINE BADGE */}
                {isHeadline && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl border border-orange-100 z-10 flex items-center gap-1.5 animate-in zoom-in-50 duration-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        Active Headline
                    </div>
                )}
            </div>

            {/* Article Content Information */}
            <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setIsEditorModalOpen(true)}
                        className="text-left group/title focus:outline-none"
                    >
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 leading-tight">
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
                                {getCategoryLabel(article.category?.categoryName ?? "")}
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
            <div className="w-full md:w-[210px] flex flex-col gap-2 flex-shrink-0 self-stretch md:self-center">

                {/* ── HIGH VISIBILITY HEADLINE CONTROL ── */}
                <div className={`relative p-3 rounded-2xl border-2 transition-all duration-500 group/spotlight overflow-hidden ${isHeadline
                        ? 'bg-gray-900 border-orange-500 shadow-xl shadow-orange-500/10'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}>
                    <AnimatePresence>
                        {isUpdatingHeadline && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-[40] flex items-center justify-center"
                            >
                                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${isHeadline
                                    ? 'bg-orange-500 text-white scale-110 rotate-12 shadow-lg shadow-orange-500/40'
                                    : 'bg-white text-gray-400 border border-gray-100'
                                }`}>
                                <Layout className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 ${isHeadline ? 'text-orange-400' : 'text-gray-400'
                                    }`}>Spotlight</span>
                                <span className={`text-xs font-bold leading-none ${isHeadline ? 'text-white' : 'text-gray-900'
                                    }`}>Headline</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleHeadlineToggle}
                            disabled={isUpdatingHeadline}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isHeadline ? 'bg-orange-500' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${isHeadline ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                            />
                            {isUpdatingHeadline && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsEditorModalOpen(true)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all group/review ${
                        isPublished
                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50'
                    }`}
                >
                    <Newspaper className={`w-4 h-4 transition-colors ${isPublished ? 'text-gray-400 group-hover/review:text-gray-900' : ''}`} />
                    {isPublished ? 'Edit' : 'Review'}
                </button>

                {isPublished ? (
                    <button
                        type="button"
                        onClick={handleUnpublishClick}
                        disabled={isUnpublishing}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-red-50 text-red-600 hover:bg-red-100 transition-all group/btn disabled:opacity-50"
                    >
                        {isUnpublishing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <EyeOff className="w-4 h-4 text-red-400 group-hover/btn:text-red-600 transition-colors" />
                        )}
                        Unpublish
                    </button>
                ) : null}

                <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gray-50 text-red-600 hover:bg-red-50 transition-all group/delete disabled:opacity-50"
                >
                    {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4 text-red-400 group-hover/delete:text-red-600 transition-colors" />
                    )}
                    Delete
                </button>

                <ArticleEditorModal
                    article={article}
                    open={isEditorModalOpen}
                    onOpenChange={setIsEditorModalOpen}
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

                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Article?"
                    description="Are you sure you want to delete this generated article? This action cannot be undone."
                    confirmText="Yes, Delete"
                    variant="destructive"
                    isLoading={isDeleting}
                />

                <ConfirmationModal
                    isOpen={isHeadlineConfirmOpen}
                    onOpenChange={setIsHeadlineConfirmOpen}
                    onConfirm={handleHeadlineConfirm}
                    title={isHeadline ? "Remove from Headline?" : "Set as Headline?"}
                    description={isHeadline
                        ? "This article will no longer be featured in the hero spotlight of your site."
                        : "This will make this article the primary feature on your site's landing page. Any existing headline will be replaced."
                    }
                    confirmText={isHeadline ? "Yes, Remove" : "Yes, Set Headline"}
                    variant={isHeadline ? "warning" : "default"}
                    isLoading={isUpdatingHeadline}
                />
            </div>
        </motion.div>
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

    // Real-time updates via SSE — invalidates cache whenever an article is created/published
    useArticleStream();

    const { data, isLoading, isFetching, isError } = useQuery<GeneratedArticlesResponse>({
        queryKey: ['generatedArticles', { searchQuery, currentPage, category, date, status }],
        queryFn: () => articlesApi.getGeneratedArticles({
            page: currentPage,
            limit,
            q: searchQuery,
            category: category || undefined,
            status: status || undefined
        }),
        placeholderData: (prev: GeneratedArticlesResponse | undefined) => prev,
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
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Generated <span className="text-orange-600">Content</span>
                    </h1>
                    {isFetching && !isLoading && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Updating…
                        </span>
                    )}
                </div>
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
                            {(categories ?? []).map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.name} className="font-medium">
                                    {getCategoryLabel(cat.name)}
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
                <motion.div
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
                </motion.div>
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
