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
import TwitterStatusEmbed from "@/components/article/TwitterStatusEmbed";
import {
  isSocialCommentaryGenerationMode,
  splitReferenceLineFromContent,
  stripOriginalPostBlock,
} from "@/lib/tweetArticleDisplay";

export default function ArticlePageClient({
  articleId,
  initialOtherArticles = [],
  domain
}: {
  articleId: string;
  initialOtherArticles?: Article[];
  domain: string;
}) {
  const router = useRouter();


  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  // We use the articles provided by the server for consistency
  const allArticles = initialOtherArticles;

  // We remove the full-page loading state to ensure a seamless transition.
  // The article data is populated via SSR hydration.

  if (isError || !article) {
    return (
      <div className="flex items-center justify-center py-32 px-6">
        <div className="text-center max-w-md">
          <p className="text-gray-900 font-semibold mb-2">
            We couldn’t load this article.
          </p>
          <p className="text-gray-600 mb-6">
            Please try again, or go back to the homepage.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#ff4500] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const otherArticles = allArticles.filter((a) => a.id !== article.id);
  const trendingArticles = otherArticles.slice(0, 5);
  const recommendedArticles = otherArticles.slice(0, 4);

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

  // Prepare paragraphs for splitting and full content
  const paragraphs = layoutContent
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const fullContent = paragraphs.join("\n\n");
  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
      <button
        type="button"
        onClick={() =>
          window.history.length > 1 ? router.back() : router.push("/")
        }
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#ff4500] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <article>
            {/* ── Header: category, title, date ── */}
            <header>
              {normalizeCategoryName(article.category?.categoryName) ? (
                <span className="inline-block px-2 py-0.5 bg-[#ff4500] text-white rounded text-xs font-semibold uppercase mb-4">
                  {normalizeCategoryName(article.category?.categoryName)}
                </span>
              ) : null}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>
              <p className="text-gray-500">{formattedDate}</p>
            </header>

            {showTweetCommentaryEmbed && rawTweet?.tweetId ? (
              <div className="mt-6 mb-2">
                <TwitterStatusEmbed
                  tweetId={rawTweet.tweetId}
                  profileUrl={rawTweet.profileUrl}
                />
              </div>
            ) : null}

            {showYoutubePlayer ? (
              <>
                {/* YouTube Embed at the top (commentary / legacy); hidden for standalone VIDEO */}
                <div className="mt-6 mb-8 rounded-xl overflow-hidden bg-black aspect-video shadow-lg">
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
                    {/* Article content — first half */}
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {firstHalf}
                    </div>

                    {/* Hero image — inside the article */}
                    <div className="my-8 rounded-xl overflow-hidden bg-gray-200 relative aspect-video shadow-sm">
                      <StoryImage
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 80vw"
                        className="object-cover"
                        variant="hero"
                      />
                    </div>

                    {/* Article content — second half */}
                    {secondHalf && (
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {secondHalf}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {fullContent}
                  </div>
                )}
                {referenceLine ? (
                  <p className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
                    {referenceLine}
                  </p>
                ) : null}
              </>
            ) : (
              <>

                {/* Hero image — at the top for standard articles (and standalone YouTube articles) */}
                <div className="mt-6 rounded-xl overflow-hidden bg-gray-200 relative aspect-video shadow-sm">
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


                {/* Article content — full */}
                <div className="mt-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {fullContent}
                </div>
                {referenceLine ? (
                  <p className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
                    {referenceLine}
                  </p>
                ) : null}
              </>
            )}
          </article>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <TrendingSidebar articles={trendingArticles} domain={domain} />
          <AdBanner position="ARTICLE_SIDEBAR" />
        </div>
      </div>

      {recommendedArticles.length > 0 && (
        <div className="mt-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recommended articles
          </h2>
          <FeaturedArticlesSection articles={recommendedArticles} domain={domain} />
        </div>
      )}
    </main>
  );
}
