"use client";

import Image from 'next/image';
import { 
    Globe, 
    ExternalLink, 
    Calendar, 
    Zap, 
    Check 
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';

interface CrawledArticleCardProps {
    article: {
        id: string;
        title: string;
        content: string | null;
        imageUrl: string | null;
        publishDate: Date | null;
        createdAt: Date;
        category: {
            categoryName: string;
        };
        crawledUrl: {
            url: string;
        };
        contentArticle: {
            id: string;
        } | null;
    };
    variants: any; // Keep any for simplicity with RSC variants
}

export default function CrawledArticleCard({ article, variants }: CrawledArticleCardProps) {
    const isGenerated = !!article.contentArticle;
    const publishDate = article.publishDate || article.createdAt;

    // Normalize image URL to avoid passing empty/invalid values to next/image (fixes picomatch "Expected a non-empty string")
    const rawImage = article.imageUrl ?? '';
    const imageUrl = typeof rawImage === 'string' ? rawImage.trim() : '';
    const hasValidImage = imageUrl.length > 0 && imageUrl.startsWith('http');

    return (
        <MotionDiv
            variants={variants}
            whileHover={{ y: -4, scale: 1.005 }}
            className="group relative bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center"
        >

            {/* Thumbnail Image Container */}
            <div className="relative w-full md:w-64 h-48 md:h-44 rounded-[1.5rem] overflow-hidden shadow-inner bg-gray-50 flex-shrink-0">
                {hasValidImage ? (
                    <Image 
                        src={imageUrl} 
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 capitalize text-4xl font-black text-gray-200">
                        {article.title.charAt(0)}
                    </div>
                )}
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                    news
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Article Content Information */}
            <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                        {article.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 font-medium leading-relaxed max-w-2xl">
                        {article.content || "No excerpt available for this intelligence report. Review the source content for full details."}
                    </p>
                </div>

                {/* Meta Badges Row */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{article.category?.categoryName ?? 'Uncategorized'}</span>
                    </div>

                    {isGenerated ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <Zap className="w-3 h-3 fill-emerald-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">Generated</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                        </div>
                    )}

                    {article.crawledUrl?.url ? (
                        <a 
                            href={article.crawledUrl.url} 
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 hover:bg-blue-600 hover:text-white transition-all group/link shadow-sm"
                        >
                            <Globe className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase tracking-wider">Source</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/link:opacity-100 -translate-x-1 group-hover/link:translate-x-0 transition-all" />
                        </a>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                            <Globe className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase tracking-wider">Source</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-bold tracking-tight">{new Date(publishDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full md:w-auto flex flex-col gap-2 flex-shrink-0 self-stretch md:self-center justify-center">
                <button className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all group/btn">
                    <Zap className="w-5 h-5 group-hover:animate-pulse" />
                    Generate
                </button>
            </div>
        </MotionDiv>
    );
}