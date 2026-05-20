"use client";

import Image from "next/image";
import { useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { ArticleLink } from "@/components/home/ArticleLink";
import type { Article } from "@/lib/types";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import { getDomainColor } from "@/lib/domainColors";
import { ClientPagination } from "@/components/home/ClientPagination";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";


interface LatestStoriesSectionProps {
  articles: Article[];
  error: string;
  searchQuery: string | null;
  isLoading?: boolean;
  domain: string;
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateContent(content: string | null, maxLength = 120): string {
  if (!content) return "";
  const plain = content.replace(/<[^>]*>/g, "").trim();
  return plain.length <= maxLength ? plain : plain.slice(0, maxLength) + "…";
}

import { StoryImage } from "@/components/StoryImage";

export function LatestStoriesSection({
  articles,
  error,
  searchQuery,
  isLoading = false,
  domain,
}: LatestStoriesSectionProps) {
  const router = useRouter();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const domainColor = getDomainColor(domain);

  const totalPages = Math.ceil(articles.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const latestStories = articles.slice(startIndex, endIndex);

  const clearSearch = () => {
    router.push("/");
  };

  return (
    <div id="latest-stories" className="lg:col-span-2 scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        {domain.includes('skyblueprime') ? (
          <div className="border-t-[4px] border-sky-950 pt-3 w-full">
            <h2 className="text-[13px] font-black text-sky-950 uppercase tracking-widest">Latest Stories</h2>
          </div>
        ) : (
          <h2 className={`text-2xl font-bold text-gray-900 ${domain.includes('voicejeju') ? 'font-voltaire uppercase tracking-tight text-3xl border-b-2 border-black pb-2' : 'font-serif'}`}>
            Latest Stories
          </h2>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-row gap-4 pb-6 border-b border-gray-200 rounded-lg p-2 sm:p-3 animate-pulse"
            >
              <div className="relative w-28 sm:w-40 h-20 sm:h-28 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">{error}</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No articles found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search terms
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-6 py-2.5 text-white rounded-lg transition-colors font-medium"
              style={{ backgroundColor: domainColor.hex }}
              onMouseEnter={(e) => {
                // Approximate darker version by reducing brightness or just using a simple overlay if needed, 
                // but for now let's just stick to the main color to keep it simple and working.
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const isVoiceJeju = domain.includes('voicejeju');
            const isJejuQQ = domain === 'jejuqq.com';
            const isSkyBluePrime = domain.includes('skyblueprime');
            return (searchQuery ? articles : latestStories).map((article, index) => (
            <Fragment key={article.id}>
              {isSkyBluePrime ? (
                <ArticleLink
                  articleIdentifier={article.slug ?? article.id}
                  href={`/article/${article.slug ?? article.id}`}
                  className="group cursor-pointer flex flex-row gap-4 pb-6 border-b border-sky-100 hover:bg-sky-50/50 transition-colors p-2 sm:p-3"
                >
                  <div className="relative w-28 sm:w-36 h-20 sm:h-24 bg-sky-100 overflow-hidden flex-shrink-0">
                    <StoryImage
                      src={article.imageUrl}
                      alt={article.title}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      variant="thumbnail"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    {normalizeCategoryName(article.category?.categoryName) && (
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-1.5">
                        {normalizeCategoryName(article.category?.categoryName)}
                      </span>
                    )}
                    <h3 className="text-[17px] font-bold text-sky-950 mb-2 leading-tight line-clamp-2 group-hover:text-sky-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-sky-800/70 mb-2 line-clamp-2 font-medium">
                      {truncateContent(article.content)}
                    </p>
                    <span className="text-[9px] font-bold text-sky-950 uppercase tracking-widest">
                      {formatDate(article.createdAt)}
                    </span>
                  </div>
                </ArticleLink>
              ) : (
                <ArticleLink
                  articleIdentifier={article.slug ?? article.id}
                  href={`/article/${article.slug ?? article.id}`}
                  className={`group cursor-pointer flex ${isJejuQQ || isVoiceJeju ? 'rounded-none' : 'rounded-lg'} ${isJejuQQ ? 'flex-row-reverse' : 'flex-row'} gap-4 pb-6 border-b border-gray-200 hover:bg-gray-50 transition-colors p-2 sm:p-3`}
                >
                  <div className={`relative w-28 sm:w-40 h-20 sm:h-28 bg-gray-200 ${isJejuQQ ? 'rounded-none border-2 border-primary' : 'rounded-lg'} overflow-hidden flex-shrink-0`}>
                    <StoryImage
                      src={article.imageUrl}
                      alt={article.title}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      variant="thumbnail"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      {normalizeCategoryName(article.category?.categoryName) ? (
                        <span className={`inline-block ${isJejuQQ ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700'} px-2 py-0.5 rounded text-xs font-semibold uppercase`}>
                          {normalizeCategoryName(article.category?.categoryName)}
                        </span>
                      ) : null}
                    </div>
                    <h3
                      className={`text-lg font-bold text-gray-900 mb-2 transition-colors line-clamp-2 ${isVoiceJeju ? 'font-voltaire uppercase tracking-tight text-xl' : 'font-serif'}`}
                      onMouseEnter={(e) => e.currentTarget.style.color = domainColor.hex}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#111827'}
                    >
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {truncateContent(article.content)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(article.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        5 min read
                      </span>
                    </div>
                  </div>
                </ArticleLink>
              )}
              {index === 2 && domain.toLowerCase().includes("jejujapan") && (
                <div className="my-6 py-4 border-y border-gray-100 flex justify-center w-full">
                  <div className="hidden sm:block">
                    <AdsterraBanner bannerKey={ADSTERRA_CONFIG.jejujapan.banners["468x60"]} width={468} height={60} className="!my-0" />
                  </div>
                  <div className="block sm:hidden">
                    <AdsterraBanner bannerKey={ADSTERRA_CONFIG.jejujapan.banners["320x50"]} width={320} height={50} className="!my-0" />
                  </div>
                </div>
              )}
              {index === 2 && isSkyBluePrime && (
                <div className="my-6 py-4 border-y border-sky-100 flex justify-center w-full bg-sky-50/30">
                  <div className="hidden sm:block">
                    <AdsterraBanner bannerKey={ADSTERRA_CONFIG.skyblueprime.banners["468x60"]} width={468} height={60} className="!my-0" />
                  </div>
                  <div className="block sm:hidden">
                    <AdsterraBanner bannerKey={ADSTERRA_CONFIG.skyblueprime.banners["320x50"]} width={320} height={50} className="!my-0" />
                  </div>
                </div>
              )}
            </Fragment>
          ))
          })()}

          {/* Pagination Controls */}
          {!searchQuery && articles.length > 0 && (
            <ClientPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={articles.length}
              startIndex={startIndex}
              endIndex={endIndex}
              domain={domain}
            />
          )}
        </div>
      )}
    </div>
  );
}
