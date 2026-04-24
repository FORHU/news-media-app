import React, { Suspense } from 'react';
import ScrapedTweets from '@/components/admin/ContentSourcing/xMonitoring/ScrapedTweets/ScrapedTweets';

export const metadata = {
  title: 'Crawled X Content | Admin Dashboard',
  description: 'View and manage content crawled from X.',
};

export default function CrawledXContentPage() {
  return (
    <Suspense fallback={<div>Loading content...</div>}>
      <ScrapedTweets />
    </Suspense>
  );
}
