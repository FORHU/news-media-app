import React from 'react';
import YoutubeManager from '@/components/admin/youtube/YoutubeManager';

export const metadata = {
  title: 'YouTube Generation | Admin Dashboard',
  description: 'Transform YouTube videos into news articles.',
};

export default function YoutubeGenerationPage() {
  return <YoutubeManager />;
}
