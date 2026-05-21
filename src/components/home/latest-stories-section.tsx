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
  categoryName?: string | null;
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
  categoryName,
  isLoading = false,
  domain,
}: LatestStoriesSectionProps) {
  const router = useRouter();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const scrollToStories = () => {
    const element = document.getElementById("latest-stories");
    if (element) {
      element.scrollIntoView({ behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const handlePageChange = (page: number) => {
    // Scroll BEFORE state change so the viewport snaps while page is still full height
    scrollToStories();
    setIsTransitioning(true);
    setCurrentPage(page);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 250);
  };

  const handleItemsPerPageChange = (count: number) => {
    scrollToStories();
    setIsTransitioning(true);
    setItemsPerPage(count);
    setCurrentPage(1);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 250);
  };

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
        ) : domain.includes('jejujapan') ? (
          <div className="border-t-4 border-[#bc002d] pt-3 w-full">
            <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">
              {categoryName ? categoryName : searchQuery ? "検索結果" : "最新記事"}
            </h2>
          </div>
        ) : domain.includes('jejuqq') ? (
          <div className="w-full flex items-center gap-3">
            <span className="h-0.5 w-8 bg-[#dc2626] flex-shrink-0"></span>
            <h2 className="text-[15px] font-serif font-bold text-gray-900 uppercase tracking-tight">
              Latest Stories
            </h2>
          </div>
        ) : (
          <h2 className={`text-2xl font-bold text-gray-900 ${domain.includes('voicejeju') ? 'font-voltaire uppercase tracking-tight text-3xl' : 'font-serif'}`}>
            Latest Stories
          </h2>
        )}
      </div>

      {isLoading || isTransitioning ? (
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
        domain.includes("voicejeju") ? (
          <div className="py-24 text-center border-y border-gray-100">
            <p className="font-voltaire text-5xl uppercase tracking-tighter text-black mb-4">
              Nothing Found
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-8">
              Try adjusting your search terms or browse by category
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-black border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : domain.includes("jejujapan") ? (
          <div className="py-24 text-center border-y border-gray-100">
            <p className="text-3xl font-bold text-gray-900 mb-3">記事が見つかりません</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">
              検索条件を変更してください
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white bg-[#bc002d] px-6 py-3 hover:bg-[#a0001f] transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : domain.includes("jejuqq") ? (
          <div className="py-24 text-center border-y border-gray-200">
            <p className="text-3xl font-garamond font-bold text-gray-900 mb-3">
              No articles found
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">
              Try adjusting your filters or search terms
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white bg-[#dc2626] px-6 py-3 hover:bg-black transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
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
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {(() => {
            const isVoiceJeju = domain.includes('voicejeju');
            const isJejuQQ = domain.includes('jejuqq');
            const isSkyBluePrime = domain.includes('skyblueprime');
            const isJejuJapan = domain.includes('jejujapan');
            return latestStories.map((article, index) => (
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
              ) : isVoiceJeju ? (
                <ArticleLink
                  articleIdentifier={article.slug ?? article.id}
                  href={`/article/${article.slug ?? article.id}`}
                  className="group cursor-pointer flex flex-row gap-5 py-5 border-b border-gray-100 border-l-2 border-l-transparent hover:border-l-black transition-colors"
                >
                  <div className="relative w-36 sm:w-48 flex-shrink-0 overflow-hidden bg-gray-50" style={{ aspectRatio: "4/3" }}>
                    <StoryImage
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 144px, 192px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      variant="thumbnail"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    {normalizeCategoryName(article.category?.categoryName) && (
                      <span className="inline-block bg-black text-white text-[9px] font-black uppercase tracking-[0.4em] px-2 py-0.5 mb-2">
                        {normalizeCategoryName(article.category?.categoryName)}
                      </span>
                    )}
                    <h3 className="font-voltaire text-xl uppercase tracking-tight leading-tight mb-2 line-clamp-2 group-hover:underline transition-all">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                      {truncateContent(article.content)}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
                      {formatDate(article.createdAt)} · {Math.max(1, Math.ceil((article.content ?? "").trim().split(/\s+/).filter(Boolean).length / 200))} min read
                    </span>
                  </div>
                </ArticleLink>
              ) : isJejuJapan ? (
                <ArticleLink
                  articleIdentifier={article.slug ?? article.id}
                  href={`/article/${article.slug ?? article.id}`}
                  className="group cursor-pointer flex flex-row gap-4 py-5 border-b border-gray-100 hover:bg-red-50/20 transition-colors"
                >
                  <div className="relative w-32 sm:w-44 flex-shrink-0 overflow-hidden bg-gray-100" style={{ aspectRatio: "4/3" }}>
                    <StoryImage
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 128px, 176px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      variant="thumbnail"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    {normalizeCategoryName(article.category?.categoryName) && (
                      <span className="inline-block text-[#bc002d] text-[9px] font-black uppercase tracking-[0.3em] border border-[#bc002d] px-2 py-0.5 mb-2">
                        {normalizeCategoryName(article.category?.categoryName)}
                      </span>
                    )}
                    <h3 className="text-[16px] font-bold text-gray-900 mb-2 leading-tight line-clamp-2 group-hover:text-[#bc002d] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                      {truncateContent(article.content)}
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
                      {formatDate(article.createdAt)} · {Math.max(1, Math.ceil((article.content ?? "").trim().split(/\s+/).filter(Boolean).length / 200))} min read
                    </span>
                  </div>
                </ArticleLink>
              ) : isJejuQQ ? (
                <ArticleLink
                  articleIdentifier={article.slug ?? article.id}
                  href={`/article/${article.slug ?? article.id}`}
                  className="group cursor-pointer flex flex-row gap-4 py-5 border-b border-gray-200 hover:bg-[#fdf2f2]/50 transition-colors"
                >
                  <div className="relative w-28 sm:w-36 flex-shrink-0" style={{ aspectRatio: "4/3" }}>
                    <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-[#dc2626]/10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className="relative h-full w-full overflow-hidden border-2 border-[#dc2626] bg-gray-50">
                      <StoryImage
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 112px, 144px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        variant="thumbnail"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left pt-0.5">
                    {normalizeCategoryName(article.category?.categoryName) && (
                      <span className="inline-block text-[#dc2626] text-[9px] font-bold font-serif uppercase tracking-[0.3em] mb-2">
                        {normalizeCategoryName(article.category?.categoryName)}
                      </span>
                    )}
                    <h3 className="text-[16px] font-serif font-bold text-gray-900 mb-2 leading-tight line-clamp-2 group-hover:text-[#dc2626] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                      {truncateContent(article.content)}
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500">
                      {formatDate(article.createdAt)} · {Math.max(1, Math.ceil((article.content ?? "").trim().split(/\s+/).filter(Boolean).length / 200))} min read
                    </span>
                  </div>
                </ArticleLink>
              ) : (
                <ArticleLink
                  articleIdentifier={article.slug ?? article.id}
                  href={`/article/${article.slug ?? article.id}`}
                  className="group cursor-pointer flex flex-row gap-4 pb-6 border-b border-gray-200 hover:bg-gray-50 transition-colors rounded-lg p-2 sm:p-3"
                >
                  <div className="relative w-28 sm:w-40 h-20 sm:h-28 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                        <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                          {normalizeCategoryName(article.category?.categoryName)}
                        </span>
                      ) : null}
                    </div>
                    <h3
                      className="text-lg font-bold font-serif text-gray-900 mb-2 transition-colors line-clamp-2"
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
                        {Math.max(1, Math.ceil((article.content ?? "").trim().split(/\s+/).filter(Boolean).length / 200))} min read
                      </span>
                    </div>
                  </div>
                </ArticleLink>
              )}
              {index === 2 && domain.toLowerCase().includes("jejujapan") && (
                <div className="my-6 py-4 border-y border-gray-100 flex justify-center w-full overflow-hidden">
                  <div className="hidden sm:block">
                    <AdsterraBanner bannerKey={ADSTERRA_CONFIG.jejujapan.banners["728x90"]} width={728} height={90} className="!my-0" />
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
              {index === 2 && isJejuQQ && (
                <div className="my-6 py-4 border-y border-gray-200 flex justify-center w-full overflow-hidden">
                  <div className="hidden sm:block">
                    <AdsterraBanner bannerKey={ADSTERRA_CONFIG.jejuqq.banners["728x90"]} width={728} height={90} className="!my-0" />
                  </div>
                  <div className="block sm:hidden">
                    <AdsterraBanner bannerKey={ADSTERRA_CONFIG.jejuqq.banners["320x50"]} width={320} height={50} className="!my-0" />
                  </div>
                </div>
              )}
            </Fragment>
          ))
          })()}

          {/* Pagination Controls */}
          {articles.length > 0 && (
            <ClientPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
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
