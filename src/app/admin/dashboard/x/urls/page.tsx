import React from 'react';
import CrawlXManager from '@/components/admin/crawlX/CrawlXManager';

export const metadata = {
  title: 'X Crawl Management | Admin Dashboard',
  description: 'Manage X profiles and keywords for crawling.',
};

export default function CrawlXUrlsPage() {
  return <CrawlXManager />;
}
