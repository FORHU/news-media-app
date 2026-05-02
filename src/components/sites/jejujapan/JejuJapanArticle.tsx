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

export default function JejuJapanArticle({ 
  articleId, 
  initialOtherArticles = [],
  domain = "jejujapan.com"
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
          <p className="text-gray-900 font-semibold mb-2">We couldn’t load this article.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#bc002d] transition-colors">
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 bg-white font-sans">
      <button onClick={() => window.history.length > 1 ? router.back() : router.push("/")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#bc002d] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <article>
            <header className="mb-8 border-b-2 border-gray-100 pb-8">
              {normalizeCategoryName(article.category?.categoryName) && (
                <span className="inline-block px-3 py-1 bg-[#bc002d] text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                  {normalizeCategoryName(article.category?.categoryName)}
                </span>
              )}
              <h1 className="text-4xl sm:text-5xl font-serif font-black text-black mb-6 leading-tight">
                {article.title}
              </h1>
              <p className="text-gray-500 text-sm">{formattedDate}</p>
            </header>

            {youtubeId ? (
              <>
                <div className="mb-8 overflow-hidden bg-black aspect-video">
                  <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video player" allowFullScreen className="w-full h-full border-0" />
                </div>
                {article.imageUrl ? (
                  <>
                    <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap font-serif mb-8">{firstHalf}</div>
                    <div className="my-10 relative aspect-[21/9] bg-gray-100">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" />
                    </div>
                    {secondHalf && <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap font-serif">{secondHalf}</div>}
                  </>
                ) : (
                  <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap font-serif first-letter:text-6xl first-letter:font-black first-letter:text-[#bc002d] first-letter:float-left first-letter:mr-3">
                    {fullContent}
                  </div>
                )}
              </>
            ) : (
              <>
                {article.imageUrl && (
                  <div className="mb-10 relative aspect-[21/9] bg-gray-100">
                    <StoryImage src={article.imageUrl} alt={article.title} fill priority className="object-cover" variant="hero" />
                  </div>
                )}
                <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap font-serif first-letter:text-6xl first-letter:font-black first-letter:text-[#bc002d] first-letter:float-left first-letter:mr-3">
                  {fullContent}
                </div>
              </>
            )}
          </article>
        </div>

        <div className="lg:col-span-1 space-y-10 border-l border-gray-100 pl-8">
          <TrendingSidebar articles={trendingArticles} domain={domain} />
          <AdBanner position="ARTICLE_SIDEBAR" />
        </div>
      </div>

      {recommendedArticles.length > 0 && (
        <div className="mt-16 pt-16 border-t border-gray-200">
          <h2 className="text-3xl font-serif font-black text-black mb-8 border-l-4 border-[#bc002d] pl-4">
            Recommended Stories
          </h2>
          <FeaturedArticlesSection articles={recommendedArticles} />
        </div>
      )}
    </main>
  );
}
