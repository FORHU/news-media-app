import React, { Suspense } from 'react';
import RawArticles from '@/components/admin/ContentSourcing/WebScraping/RawArticles/RawArticles';

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
        <Suspense fallback={<div>Loading articles...</div>}>
            <RawArticles searchParams={searchParams} />
        </Suspense>
    );
}