import React from 'react';
import NavigatingDropdown from '@/components/admin/NavigatingDropdown';
import {
    Search,
    Globe,
    Calendar,
    Newspaper
} from 'lucide-react';
import { div as MotionDiv } from 'framer-motion/client';
import CrawledArticleCard from '@/components/admin/crawledArticles/crawledArticlesCard';
import Pagination from '@/components/admin/pagination';

export default async function CrawledArticlesPage(props: {
    searchParams: Promise<{ source?: string; date?: string; q?: string; page?: string }>;
}) {
    const searchParams = await props.searchParams;
    const filterSource = searchParams.source || 'All Sources';
    const filterDate = searchParams.date || 'Today';
    const searchQuery = searchParams.q || '';
    const currentPage = parseInt(searchParams.page || '1');

    // Fetch data via the new API route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiUrl = new URL(`${baseUrl}/api/admin/crawledArticles`);
    apiUrl.searchParams.append('source', filterSource);
    apiUrl.searchParams.append('date', filterDate);
    apiUrl.searchParams.append('q', searchQuery);
    apiUrl.searchParams.append('page', currentPage.toString());
    apiUrl.searchParams.append('limit', '10');

    const res = await fetch(apiUrl.toString(), { cache: 'no-store' });
    const data = res.ok ? await res.json() : { articles: [], sources: ['All Sources'], pagination: { totalPages: 0 } };
    const { articles, sources, pagination } = data;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    } as const;

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    } as const;

    return (
        <div className="space-y-8 min-h-screen pb-20">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Crawled <span className="text-orange-600">Articles</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg">
                    Discover and transform automated intelligence into premium news content.
                </p>
            </div>

            {/* Premium Filter Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sticky top-4 z-10">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search intelligence..."
                        defaultValue={searchQuery}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-200 outline-none transition-all placeholder:text-gray-400"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <NavigatingDropdown
                        options={sources}
                        value={filterSource}
                        paramName="source"
                        icon={<Globe className="w-4 h-4" />}
                        className="flex-1 md:flex-none md:w-48 !rounded-2xl !py-3.5"
                    />

                    <NavigatingDropdown
                        options={['Today', 'Last 7 Days', 'This Month']}
                        value={filterDate}
                        paramName="date"
                        icon={<Calendar className="w-4 h-4" />}
                        className="flex-1 md:flex-none md:w-48 !rounded-2xl !py-3.5"
                    />
                </div>
            </div>

            {/* Grid of Article Cards */}
            <MotionDiv 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6"
            >
                {articles.length > 0 ? (
                    articles.map((article: any) => (
                        <CrawledArticleCard 
                            key={article.id} 
                            article={article} 
                            variants={itemVariants} 
                        />
                    ))
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Newspaper className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold text-lg">No intelligence discovered yet.</p>
                        <p className="text-gray-300 text-sm italic">The crawler is scanning the horizon for fresh news...</p>
                    </div>
                )}
            </MotionDiv>

            {/* Pagination Segment */}
            <Pagination 
                totalPages={pagination?.totalPages || 0} 
                currentPage={currentPage} 
            />
        </div>
    );
}