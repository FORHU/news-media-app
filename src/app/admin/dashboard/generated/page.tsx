import React, { Suspense } from 'react';
import GeneratedArticlesList from '@/components/admin/generatedContent/generatedArticlesCard';

export default async function GeneratedArticlesPage(props: {
    searchParams: Promise<{
        q?: string;
        page?: string;
        category?: string;
        date?: string;
    }>;
}) {
    const searchParams = await props.searchParams;

    return (
        <Suspense fallback={<div>Loading articles...</div>}>
            <GeneratedArticlesList searchParams={searchParams} />
        </Suspense>
    );
}
