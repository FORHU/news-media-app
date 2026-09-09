"use client";

import React from 'react';
import {
    Calendar,
    Check,
    Search,
    Rss,
    Loader2,
    EyeOff,
    Trash2,
    Globe2,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Pagination from '@/components/admin/pagination';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { GeneralPublishBroadcast, GeneralPublishesResponse } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateGeneralArticleModal from '@/components/admin/generalPublish/CreateGeneralArticleModal/createGeneralArticleModal';
import GeneralPublishEditorModal from '@/components/admin/generalPublish/GeneralPublishEditorModal';
import { StoryImage } from '@/components/StoryImage';
import ConfirmationModal from '@/components/admin/shared/ConfirmationModal';
import { GENERAL_CATEGORIES } from '@/config/generalCategories';
import { useArticleStream } from '@/hooks/useArticleStream';

const ALL_CATEGORIES_VALUE = '__all_categories__';
const ALL_STATUS_VALUE = '__all_status__';

interface GeneralPublishCardProps {
    broadcast: GeneralPublishBroadcast;
    variants: Variants;
}

export function GeneralPublishCard({ broadcast, variants }: GeneralPublishCardProps) {
    const isPublished = broadcast.publishedCount > 0;

    const [isEditorModalOpen, setIsEditorModalOpen] = React.useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
    const [isUnpublishing, setIsUnpublishing] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isDeletedLocally, setIsDeletedLocally] = React.useState(false);
    const queryClient = useQueryClient();

    const handleUnpublishClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmModalOpen(true);
    };

    const handleUnpublishConfirm = async () => {
        setIsUnpublishing(true);
        try {
            await articlesApi.unpublishGeneralPublish(broadcast.id);
            queryClient.invalidateQueries({ queryKey: ['generalPublishes'] });
            setIsConfirmModalOpen(false);
        } catch (error) {
            console.error('Failed to unpublish broadcast:', error);
            alert('Failed to unpublish broadcast. Please try again.');
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
            await articlesApi.deleteGeneralPublish(broadcast.id);
            setIsDeletedLocally(true);
            queryClient.invalidateQueries({ queryKey: ['generalPublishes'] });
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Failed to delete broadcast:', error);
            alert('Failed to delete broadcast. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -4, scale: 1.002 }}
            className={`group relative bg-white rounded-[1.5rem] p-3.5 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 border border-gray-100 transition-all duration-300 flex flex-col md:flex-row gap-5 items-start md:items-center ${isDeletedLocally ? 'hidden' : ''}`}
        >
            <div className="relative w-full md:w-56 h-36 md:h-32 rounded-[1.2rem] overflow-hidden shadow-inner bg-gray-50 flex-shrink-0">
                <StoryImage
                    src={broadcast.imageUrl}
                    alt={broadcast.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 256px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setIsEditorModalOpen(true)}
                        className="text-left group/title focus:outline-none"
                    >
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 leading-tight">
                            {broadcast.title}
                        </h3>
                    </button>
                    <p className="text-gray-500 text-sm line-clamp-2 font-medium leading-relaxed max-w-2xl">
                        {broadcast.content || "No content available."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{broadcast.category}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                        <Globe2 className="w-3 h-3" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {broadcast.publishedCount}/{broadcast.targetCount} sites published
                        </span>
                    </div>

                    {isPublished ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <Check className="w-3 h-3 fill-emerald-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">Published</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">Draft</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-bold tracking-tight">{new Date(broadcast.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {broadcast.targets.map((t) => (
                        <span
                            key={t.tenantId}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                                t.status === 'published'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-gray-50 text-gray-400 border-gray-100'
                            }`}
                        >
                            {t.domain}
                        </span>
                    ))}
                </div>
            </div>

            <div className="w-full md:w-[210px] flex flex-col gap-2 flex-shrink-0 self-stretch md:self-center">
                <button
                    type="button"
                    onClick={() => setIsEditorModalOpen(true)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all group/review ${
                        isPublished
                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50'
                    }`}
                >
                    <Rss className={`w-4 h-4 transition-colors ${isPublished ? 'text-gray-400 group-hover/review:text-gray-900' : ''}`} />
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
                        Unpublish All
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
                    Delete All
                </button>

                <GeneralPublishEditorModal
                    broadcast={broadcast}
                    open={isEditorModalOpen}
                    onOpenChange={setIsEditorModalOpen}
                />

                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onOpenChange={setIsConfirmModalOpen}
                    onConfirm={handleUnpublishConfirm}
                    title="Unpublish From All Sites?"
                    description="This will remove the article from every published site and move each copy back to pending status."
                    confirmText="Yes, Unpublish All"
                    variant="warning"
                    isLoading={isUnpublishing}
                />

                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Broadcast?"
                    description="This permanently deletes this article from every site it was published to. This action cannot be undone."
                    confirmText="Yes, Delete All"
                    variant="destructive"
                    isLoading={isDeleting}
                />
            </div>
        </motion.div>
    );
}

export default function GeneralPublishesList({ searchParams }: {
    searchParams: { q?: string; page?: string; category?: string; status?: string }
}) {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();

    const searchQuery = urlSearchParams.get('q') || searchParams.q || '';
    const category = urlSearchParams.get('category') || searchParams.category || '';
    const status = urlSearchParams.get('status') || searchParams.status || '';
    const currentPage = parseInt(urlSearchParams.get('page') || searchParams.page || '1');
    const limit = 10;

    useArticleStream();

    const { data, isLoading, isFetching, isError } = useQuery<GeneralPublishesResponse>({
        queryKey: ['generalPublishes', { searchQuery, currentPage, category, status }],
        queryFn: () => articlesApi.getGeneralPublishes({
            page: currentPage,
            limit,
            q: searchQuery,
            category: category || undefined,
            status: status || undefined,
        }),
        placeholderData: (prev: GeneralPublishesResponse | undefined) => prev,
        refetchInterval: process.env.NODE_ENV !== "production" ? 30_000 : false,
    });

    const broadcasts = data?.broadcasts || [];
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

    const [prevCategory, setPrevCategory] = React.useState(category);
    if (category !== prevCategory) {
        setPrevCategory(category);
        setCategoryDraft(category);
    }
    const [prevStatus, setPrevStatus] = React.useState(status);
    if (status !== prevStatus) {
        setPrevStatus(status);
        setStatusDraft(status);
    }
    const [prevSearchQuery, setPrevSearchQuery] = React.useState(searchQuery);
    if (searchQuery !== prevSearchQuery) {
        setPrevSearchQuery(searchQuery);
        setSearchDraft(searchQuery);
    }

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
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
    };

    return (
        <div className="space-y-8 min-h-screen pb-20">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        General <span className="text-orange-600">Publish</span>
                    </h1>
                    {isFetching && !isLoading && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Updating…
                        </span>
                    )}
                </div>
                <p className="text-gray-500 font-medium text-lg">
                    Publish one article to every site at once, aside from the Jeju sites.
                </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sticky top-4 z-10">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                        type="text"
                        placeholder="Search broadcast articles..."
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
                            {GENERAL_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat} className="font-medium">
                                    {cat}
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

            {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-bold">Loading broadcasts...</p>
                </div>
            ) : isError ? (
                <div className="py-32 flex flex-col items-center justify-center bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100 text-red-500">
                    <p className="font-bold text-lg">Failed to load broadcasts.</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6"
                >
                    <AnimatePresence>
                        {broadcasts && broadcasts.length > 0 ? (
                            broadcasts.map((broadcast: GeneralPublishBroadcast) => (
                                <GeneralPublishCard
                                    key={broadcast.id}
                                    broadcast={broadcast}
                                    variants={itemVariants}
                                />
                            ))
                        ) : (
                            <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Rss className="w-10 h-10 text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-bold text-lg">No broadcasts yet.</p>
                                <p className="text-gray-300 text-sm italic">Create one to publish across every eligible site.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {!isLoading && !isError && broadcasts && broadcasts.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={setPage}
                />
            )}

            <CreateGeneralArticleModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </div>
    );
}
