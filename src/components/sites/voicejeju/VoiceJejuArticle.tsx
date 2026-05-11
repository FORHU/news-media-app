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
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = (window.scrollY / totalHeight) * 100;
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          <p className="text-black font-black mb-2 uppercase tracking-widest">
            Content Unavailable
          </p>
          <p className="text-gray-600 mb-6">
            We couldn’t load this article. Please try again or return to the main feed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-black border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-all"
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
    <div className="bg-white min-h-screen font-inter selection:bg-black selection:text-white pb-20">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-gray-100 z-[100]">
        <div
          className="h-full bg-black transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Spacing to separate from Global Header Nav */}
      <div className="h-4 bg-white border-b border-gray-100" />

      {/* Immersive Header Wrapper */}
      <div className="bg-black text-white pt-16 pb-24 mb-16 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center relative mb-12 gap-6 sm:gap-0 min-h-[40px]">
            <button
              type="button"
              onClick={() =>
                window.history.length > 1 ? router.back() : router.push("/")
              }
              className="sm:absolute sm:left-0 inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/70 hover:text-white transition-all bg-white/5 border border-white/10 px-6 py-2.5 rounded-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {normalizeCategoryName(article.category?.categoryName) && (
              <span className="inline-block px-5 py-1.5 bg-white/10 text-white rounded-none text-[10px] font-black uppercase tracking-[0.4em] border border-white/10">
                {normalizeCategoryName(article.category?.categoryName)}
              </span>
            )}
          </div>

          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-normal text-white mb-12 font-voltaire tracking-tighter leading-[0.9] uppercase">
              {article.title}
            </h1>
            <div className="flex items-center justify-center gap-8">
              <div className="h-[1px] w-16 bg-white/20"></div>
              <div className="flex items-center gap-4 text-white/60 text-[11px] font-black uppercase tracking-[0.4em]">
                <span>{formattedDate}</span>
                <div className="w-1.5 h-1.5 bg-white/40" />
                <span>VoiceJeju Team</span>
              </div>
              <div className="h-[1px] w-16 bg-white/20"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">

          {/* Left Sidebar: Trending Stories */}
          <aside className="lg:col-span-3 space-y-16 lg:pr-10 border-r border-gray-100 hidden lg:block">
            <div className="sticky top-32">
              <div className="border-t-4 border-black pt-12 mb-12">
                <TrendingSidebar articles={trendingArticles} domain="voicejeju.com" />
              </div>
              <AdBanner position="ARTICLE_SIDEBAR" />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <article className="max-w-5xl">
              {showTweetCommentaryEmbed && rawTweet?.tweetId ? (
                <div className="mb-12">
                  <TwitterStatusEmbed
                    tweetId={rawTweet.tweetId}
                    profileUrl={rawTweet.profileUrl}
                  />
                </div>
              ) : null}

              {showYoutubePlayer ? (
                <>
                  <div className="mb-16 overflow-hidden bg-black aspect-video border border-gray-100">
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
                      <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl border-l-4 border-gray-100 pl-10 mb-16 italic opacity-95">
                        {firstHalf}
                      </div>

                      <div className="my-16 overflow-hidden bg-gray-50 relative aspect-video border-y border-gray-100">
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
                        <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl">
                          {secondHalf}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl">
                      {fullContent}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="overflow-hidden bg-gray-50 relative aspect-video lg:aspect-[21/9] border-y border-gray-100 mb-16">
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

                  <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl max-w-4xl mb-16">
                    {fullContent}
                  </div>
                </>
              )}

              {referenceLine ? (
                <div className="mt-20 pt-12 border-t border-black">
                  <p className="text-[11px] text-black font-black uppercase tracking-[0.5em] mb-6">Source & Reference</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed font-inter border-l-2 border-gray-200 pl-6">
                    {referenceLine}
                  </p>
                </div>
              ) : null}

              <ArticleShare
                site="voicejeju"
                title={article.title}
                className="mt-24 py-16 border-y border-gray-100"
              />
            </article>
          </div>
        </div>
      </div>

      {/* Recommended Articles Section: Editorial Grid */}
      {recommendedArticles.length > 0 && (
        <section className="bg-black text-white py-24 mt-32">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
            <h2 className="text-[12px] font-black uppercase tracking-[0.6em] mb-16 text-gray-400 text-center">
              Continue Reading
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full gap-0 border-t border-gray-800">
              {recommendedArticles.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/article/${rec.slug || rec.id}`}
                  className="group flex flex-col h-full border-r border-gray-800 last:border-r-0 hover:bg-white/5 transition-all"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <StoryImage
                      src={rec.imageUrl}
                      alt={rec.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">{rec.category?.categoryName}</span>
                    <h3 className="text-2xl font-normal font-voltaire mb-4 line-clamp-3 leading-tight group-hover:underline transition-all">
                      {rec.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed italic mb-6">
                      {rec.content}
                    </p>
                    <div className="mt-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-white transition-colors">
                      <Clock size={12} />
                      <span>5 MIN READ</span>
                    </div>
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
