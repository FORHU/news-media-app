"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { StoryImage } from "@/components/StoryImage";
import { articlesApi } from "@/lib/api";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import { AdBanner } from "@/components/AdBanner";
import type { Article } from "@/lib/types";
import { extractYoutubeId } from "@/lib/utils";

export default function JejuQQArticle({ 
  articleId, 
  initialOtherArticles = [],
  domain = "jejuqq.com"
}: { 
  articleId: string;
  initialOtherArticles?: Article[];
  domain?: string;
}) {
  const router = useRouter();

  const { data: article, isError } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  if (isError || !article) {
    return (
      <div className="flex items-center justify-center py-32 px-6">
        <div className="text-center max-w-md">
          <p className="text-[#222] font-semibold mb-2">We couldn’t load this article.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dc2626] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);
  const trendingArticles = otherArticles.slice(0, 5);
  const recommendedArticles = otherArticles.slice(0, 4);

  const createdAt = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate = createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const youtubeId = article.youtubeUrl ? extractYoutubeId(article.youtubeUrl) : null;
  const paragraphs = article.content.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const fullContent = paragraphs.join("\n\n");
  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 bg-white text-[#222]">
      <button onClick={() => window.history.length > 1 ? router.back() : router.push("/")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#dc2626] mb-8 transition-colors uppercase tracking-wider font-bold">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <article>
            <header className="mb-10">
              {normalizeCategoryName(article.category?.categoryName) && (
                <span className="text-[12px] text-[#dc2626] font-bold uppercase mb-4 block tracking-[0.2em]">
                  {normalizeCategoryName(article.category?.categoryName)}
                </span>
              )}
              <h1 className="text-4xl sm:text-6xl font-serif font-black leading-[1.1] mb-6">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 font-medium uppercase tracking-wider border-y border-gray-100 py-3">
                <span>{formattedDate}</span>
                <span className="w-1 h-1 bg-[#dc2626] rounded-full"></span>
                <span>By JejuQQ Team</span>
              </div>
            </header>

            {youtubeId ? (
              <>
                <div className="mb-10 bg-black aspect-video shadow-xl">
                  <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video player" allowFullScreen className="w-full h-full border-0" />
                </div>
                {article.imageUrl ? (
                  <>
                    <div className="text-gray-700 text-xl leading-relaxed whitespace-pre-wrap font-serif mb-10">{firstHalf}</div>
                    <div className="my-12 relative aspect-[4/3] bg-gray-100 shadow-xl">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" />
                    </div>
                    {secondHalf && <div className="text-gray-700 text-xl leading-relaxed whitespace-pre-wrap font-serif">{secondHalf}</div>}
                  </>
                ) : (
                  <div className="text-gray-700 text-xl leading-relaxed whitespace-pre-wrap font-serif">
                    {fullContent}
                  </div>
                )}
              </>
            ) : (
              <>
                {article.imageUrl && (
                  <div className="mb-12 relative aspect-[4/3] bg-gray-100 shadow-xl">
                    <StoryImage src={article.imageUrl} alt={article.title} fill priority className="object-cover" variant="hero" />
                  </div>
                )}
                <div className="text-gray-700 text-xl leading-relaxed whitespace-pre-wrap font-serif">
                  {fullContent}
                </div>
              </>
            )}
          </article>
        </div>

        <div className="lg:col-span-4 space-y-12">
          <div className="bg-gray-50 p-6 border-t-4 border-[#dc2626]">
             <TrendingSidebar articles={trendingArticles} domain={domain} />
          </div>
          <AdBanner position="ARTICLE_SIDEBAR" />
        </div>
      </div>

      {recommendedArticles.length > 0 && (
        <div className="mt-20 pt-12 border-t-2 border-black">
          <h2 className="text-3xl font-serif font-black mb-10 uppercase tracking-widest text-center">
            More to Discover
          </h2>
          <FeaturedArticlesSection articles={recommendedArticles} />
        </div>
      )}
    </main>
  );
}
