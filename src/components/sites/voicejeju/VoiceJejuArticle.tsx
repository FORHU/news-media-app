"use client"; // VoiceJeju Article Component

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";

import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { StoryImage } from "@/components/StoryImage";
import { articlesApi } from "@/lib/api";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import { AdBanner } from "@/components/AdBanner";
import type { Article } from "@/lib/types";
import { extractYoutubeId } from "@/lib/utils";
import TwitterStatusEmbed from "@/components/article/TwitterStatusEmbed";
import {
  isSocialCommentaryGenerationMode,
  splitReferenceLineFromContent,
  stripOriginalPostBlock,
} from "@/lib/tweetArticleDisplay";
import { ArticleShare } from "@/components/article/ArticleShare";
import { cn } from "@/lib/utils";

export function VoiceJejuArticle({
  articleId,
  initialOtherArticles = [],
}: {
  articleId: string;
  initialOtherArticles?: Article[];
}) {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);

    const lastViewed = localStorage.getItem(`viewed_${articleId}`);
    const now = Date.now();
    const lockTime = 5 * 1000;

    if (!lastViewed || now - parseInt(lastViewed) > lockTime) {
      articlesApi.recordView(articleId).catch(console.error);
      localStorage.setItem(`viewed_${articleId}`, now.toString());
    }
  }, [articleId]);

  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  const allArticles = initialOtherArticles;

  if (isError || !article) {
    return (
      <div className="flex items-center justify-center py-32 px-6 bg-white min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-gray-900 font-semibold mb-2">
            We couldn’t load this article.
          </p>
          <p className="text-gray-600 mb-6">
            Please try again, or go back to the homepage.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#e60000] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const otherArticles = allArticles.filter((a) => a.id !== article.id);

  const trendingArticles = [...otherArticles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  const recommendedArticles = [...otherArticles]
    .sort((a, b) => {
      const aSameCat = a.categoryId === article.categoryId ? 1 : 0;
      const bSameCat = b.categoryId === article.categoryId ? 1 : 0;
      if (aSameCat !== bSameCat) return bSameCat - aSameCat;

      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 4);

  const createdAt =
    article.createdAt instanceof Date
      ? article.createdAt
      : new Date(article.createdAt as string);
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rawVideo = article.rawVideo;
  const youtubeUrl = article.youtubeUrl || rawVideo?.youtubeUrl || null;
  const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  const rawTweet = article.rawTweet;
  const isCommentaryTweetArticle =
    article.sourceType === "TWEET" &&
    isSocialCommentaryGenerationMode(rawTweet?.generationMode);

  const isCommentaryVideoArticle =
    article.sourceType === "VIDEO" &&
    isSocialCommentaryGenerationMode(rawVideo?.generationMode);

  const legacyVideoArticleNoRawRow =
    article.sourceType === "VIDEO" && Boolean(youtubeId) && !rawVideo;

  const showYoutubePlayer =
    Boolean(youtubeId) &&
    (article.sourceType !== "VIDEO" ||
      isCommentaryVideoArticle ||
      legacyVideoArticleNoRawRow);

  const showTweetCommentaryEmbed =
    isCommentaryTweetArticle && Boolean(rawTweet?.tweetId);

  const isCommentaryLayoutArticle =
    isCommentaryTweetArticle || isCommentaryVideoArticle;

  const bodyContent = isCommentaryLayoutArticle
    ? stripOriginalPostBlock(article.content)
    : article.content;

  const { main: layoutContent, referenceLine } = splitReferenceLineFromContent(
    bodyContent,
    isCommentaryLayoutArticle
  );

  const paragraphs = layoutContent
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const fullContent = paragraphs.join("\n\n");
  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");

  return (
    <div className="bg-white min-h-screen font-inter">
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-8">
        <button
          type="button"
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push("/")
          }
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black mb-10 transition-colors border-b border-transparent hover:border-black pb-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Stories
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <article>
              <header className="mb-10">
                {normalizeCategoryName(article.category?.categoryName) ? (
                  <span className="inline-block text-[11px] font-black text-[#e60000] uppercase tracking-[0.25em] mb-6">
                    {normalizeCategoryName(article.category?.categoryName)}
                  </span>
                ) : null}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-gray-900 mb-8 font-voltaire tracking-tight leading-[1.1]">
                  {article.title}
                </h1>
                <div className="flex items-center gap-4 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                   <span>{formattedDate}</span>
                   <span className="w-1 h-1 bg-gray-300 rounded-full" />
                   <span>VoiceJeju Editorial</span>
                </div>
              </header>

              {showTweetCommentaryEmbed && rawTweet?.tweetId ? (
                <div className="mt-8 mb-10">
                  <TwitterStatusEmbed
                    tweetId={rawTweet.tweetId}
                    profileUrl={rawTweet.profileUrl}
                  />
                </div>
              ) : null}


              {showYoutubePlayer ? (
                <>
                  <div className="mt-6 mb-10 overflow-hidden bg-black aspect-video shadow-2xl">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>

                  {article.imageUrl ? (
                    <>
                      <div className="text-gray-800 leading-[1.7] whitespace-pre-wrap font-inter text-[17px]">
                        {firstHalf}
                      </div>

                      <div className="my-12 overflow-hidden bg-gray-100 relative aspect-video shadow-sm">
                        <StoryImage
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 80vw"
                          className="object-cover"
                          variant="hero"
                        />
                      </div>

                      {secondHalf && (
                        <div className="text-gray-800 leading-[1.7] whitespace-pre-wrap font-inter text-[17px]">
                          {secondHalf}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-10 text-gray-800 leading-[1.7] whitespace-pre-wrap font-inter text-[17px]">
                      {fullContent}
                    </div>
                  )}
                  {referenceLine ? (
                    <div className="mt-16 pt-10 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mb-4">Reference</p>
                      <p className="text-sm text-gray-500 italic leading-relaxed font-inter">
                        {referenceLine}
                      </p>
                    </div>
                  ) : null}

                </>
              ) : (
                <>
                  <div className="mt-6 overflow-hidden bg-gray-100 relative aspect-video shadow-sm border border-gray-100">
                    <StoryImage
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 80vw"
                      priority
                      className="object-cover"
                      variant="hero"
                    />
                  </div>

                  <div className="mt-12 text-gray-800 leading-[1.8] whitespace-pre-wrap font-inter text-[18px] max-w-3xl mx-auto lg:mx-0">
                    {fullContent}
                  </div>
                  {referenceLine ? (
                    <div className="mt-16 pt-10 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mb-4">Reference</p>
                      <p className="text-sm text-gray-500 italic leading-relaxed font-inter">
                        {referenceLine}
                      </p>
                    </div>
                  ) : null}
                </>
              )}

              <ArticleShare 
                site="voicejeju" 
                title={article.title} 
                className="mt-16 py-12 border-y border-gray-100"
              />
            </article>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <TrendingSidebar articles={trendingArticles} domain="voicejeju.com" />
            <div className="sticky top-28">
               <AdBanner position="ARTICLE_SIDEBAR" />
            </div>
          </div>
        </div>
      </main>

      {/* Recommended Articles Section: New Premium Magazine Design */}
      {recommendedArticles.length > 0 && (
        <section className="bg-black text-white mt-20 pt-20 pb-0">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] mb-12 text-gray-500 text-center">
              Recommended for you
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
              {recommendedArticles.map((rec) => (
                <Link 
                  key={rec.id} 
                  href={`/article/${rec.slug || rec.id}`}
                  className="group flex flex-col h-full border-r border-gray-800 last:border-r-0 hover:bg-gray-900/50 transition-colors"
                >
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-normal font-voltaire mb-4 line-clamp-3 leading-tight group-hover:text-gray-300 transition-colors">
                      {rec.title}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-6 font-medium">
                      {rec.excerpt || rec.content?.slice(0, 120)}...
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-[#e60000] transition-colors">
                       <Clock size={12} />
                       <span>5 MIN READ</span>
                    </div>
                  </div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                    <StoryImage
                      src={rec.imageUrl}
                      alt={rec.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
