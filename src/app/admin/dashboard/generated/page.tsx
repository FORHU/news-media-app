import React from 'react';
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
        <GeneratedArticlesList searchParams={searchParams} />
    );
}
