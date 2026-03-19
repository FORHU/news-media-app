import React from 'react';
import CrawledArticlesList from '@/components/admin/crawledArticles/crawledArticlesCard';

export default async function CrawledArticlesPage(props: {
    searchParams: Promise<{ 
        source?: string; 
        date?: string; 
        from?: string; 
        to?: string; 
        q?: string; 
        page?: string 
    }>;
}) {
    const searchParams = await props.searchParams;

    return (
        <CrawledArticlesList searchParams={searchParams} />
    );
}