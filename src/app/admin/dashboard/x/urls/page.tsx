import React from 'react';
import ManageHandles from '@/components/admin/ContentSourcing/xMonitoring/ManageHandles/ManageHandles';

export const metadata = {
  title: 'X Crawl Management | Admin Dashboard',
  description: 'Manage X profiles and keywords for crawling.',
};

export default function CrawlXUrlsPage() {
  return <ManageHandles />;
}
