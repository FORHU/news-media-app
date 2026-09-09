import React, { Suspense } from 'react';
import GeneralPublishesList from '@/components/admin/generalPublish/GeneralPublishesList';

export default async function GeneralPublishPage(props: {
    searchParams: Promise<{
        q?: string;
        page?: string;
        category?: string;
        status?: string;
    }>;
}) {
    const searchParams = await props.searchParams;

    return (
        <Suspense fallback={<div>Loading broadcasts...</div>}>
            <GeneralPublishesList searchParams={searchParams} />
        </Suspense>
    );
}
