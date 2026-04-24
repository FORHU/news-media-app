import React from 'react';
import Transcribe from '@/components/admin/ContentSourcing/YoutubeConversion/Transcribe/Transcribe';
import TranscribeHistory from '@/components/admin/ContentSourcing/YoutubeConversion/TranscribeHistory/TranscribeHistory';
import { Youtube } from 'lucide-react';

export const metadata = {
  title: 'YouTube Generation | Admin Dashboard',
  description: 'Transform YouTube videos into news articles.',
};

export default function YoutubeGenerationPage() {
  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-2xl">
            <Youtube className="w-10 h-10 text-red-600" />
          </div>
          YouTube <span className="text-red-600">Conversion</span>
        </h1>
        <p className="text-gray-500 font-medium text-lg">
          Transform any YouTube video into a high-quality news article instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <Transcribe />
        </div>
        <div className="lg:col-span-5">
          <TranscribeHistory />
        </div>
      </div>
    </div>
  );
}
