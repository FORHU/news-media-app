'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CircleCheck, TriangleAlert } from 'lucide-react';
import { articlesApi } from '@/lib/api';
import { toAttentionItems } from '@/lib/dashboardAttention';

// How many recent broadcasts are checked, and how many rows show before "see all".
const CHECKED = 50;
const MAX_ROWS = 5;

export default function NeedsAttention() {
    // The ['generalPublishes'] prefix means every publish/unpublish/retry
    // elsewhere refreshes this list too.
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['generalPublishes', 'attention'],
        queryFn: () => articlesApi.getGeneralPublishes({ page: 1, limit: CHECKED }),
    });

    const items = data ? toAttentionItems(data.broadcasts) : [];
    const shown = items.slice(0, MAX_ROWS);
    const hidden = items.length - shown.length;

    return (
        <section
            aria-labelledby="needs-attention-heading"
            className="bg-white rounded-3xl border border-gray-100 shadow-sm"
        >
            <div className="flex items-center justify-between gap-4 px-6 md:px-8 pt-6 md:pt-8 pb-4">
                <div>
                    <h2 id="needs-attention-heading" className="text-xl md:text-2xl font-black text-gray-900">
                        Needs attention
                    </h2>
                    <p className="text-xs md:text-sm text-gray-600 font-medium mt-1">
                        Broadcasts that failed to reach a site, or aren&apos;t live yet.
                    </p>
                </div>
                {items.length > 0 ? (
                    <span className="shrink-0 rounded-full bg-red-50 text-red-800 border border-red-200 px-3 py-1 text-xs font-black">
                        {items.length}
                    </span>
                ) : null}
            </div>

            {isLoading ? (
                <div aria-busy="true" className="px-6 md:px-8 pb-8 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-gray-200 animate-pulse" />
                </div>
            ) : isError ? (
                <div className="px-6 md:px-8 pb-8">
                    <p className="text-sm font-bold text-gray-900">Couldn&apos;t check your broadcasts.</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-2 text-xs font-black uppercase tracking-wider text-orange-700 hover:text-orange-800 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                    >
                        Try again
                    </button>
                </div>
            ) : items.length === 0 ? (
                <p className="flex items-center gap-2 px-6 md:px-8 pb-8 text-sm font-semibold text-emerald-800">
                    <CircleCheck className="w-5 h-5 shrink-0" aria-hidden />
                    Nothing needs attention. No failed or unpublished broadcasts among the latest {CHECKED}.
                </p>
            ) : (
                <>
                    <ul className="divide-y divide-gray-100 border-t border-gray-100">
                        {shown.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={`/admin/dashboard/general?q=${encodeURIComponent(item.title)}`}
                                    className="flex items-center gap-4 px-6 md:px-8 py-4 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-500"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                                        <p
                                            className={`mt-0.5 flex items-center gap-1.5 text-xs font-semibold ${
                                                item.failed ? 'text-red-800' : 'text-gray-600'
                                            }`}
                                        >
                                            {item.failed ? <TriangleAlert className="w-3.5 h-3.5 shrink-0" aria-hidden /> : null}
                                            <span className="truncate">{item.reasons.join(' · ')}</span>
                                        </p>
                                    </div>
                                    <span className="shrink-0 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-700">
                                        Review
                                        <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {hidden > 0 ? (
                        <div className="px-6 md:px-8 py-4 border-t border-gray-100">
                            <Link
                                href="/admin/dashboard/general"
                                className="text-xs font-black uppercase tracking-wider text-orange-700 hover:text-orange-800 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                            >
                                See {hidden} more in General Publish
                            </Link>
                        </div>
                    ) : null}
                </>
            )}
        </section>
    );
}
