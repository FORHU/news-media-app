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
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import type { Article } from "@/lib/types";
import { extractYoutubeId } from "@/lib/utils";
import TwitterStatusEmbed from "@/components/article/TwitterStatusEmbed";
import {
  isSocialCommentaryGenerationMode,
  splitReferenceLineFromContent,
  stripOriginalPostBlock,
} from "@/lib/tweetArticleDisplay";
import { ArticleShare } from "@/components/article/ArticleShare";

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

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen font-inter pb-20">
        <div className="fixed top-0 left-0 w-full h-[3px] bg-gray-100 z-[100]" />
        <div className="h-2 bg-white border-b border-gray-100" />
        <div className="bg-black pt-8 pb-12 mb-8">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <div className="flex justify-center mb-8">
              <div className="h-8 w-20 bg-white/10 rounded-sm animate-pulse" />
            </div>
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="h-20 sm:h-28 lg:h-36 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-56 bg-white/10 rounded animate-pulse mx-auto" />
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-3 hidden lg:block space-y-6">
              {[100, 85, 95, 80, 90].map((w, i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="lg:col-span-9 space-y-5">
              <div className="aspect-video w-full bg-gray-100 animate-pulse" />
              <div className="space-y-3 max-w-4xl">
                {[100, 92, 97, 88, 95, 78, 90, 85].map((w, i) => (
                  <div key={i} className="h-4 bg-gray-100 animate-pulse rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-32 px-6 bg-white min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-black font-black mb-2 uppercase tracking-widest">
            Something Went Wrong
          </p>
          <p className="text-gray-600 mb-6">
            We had trouble loading this article. Please check your connection and try again.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black border-2 border-black px-6 py-3 hover:bg-gray-800 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-black border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center py-32 px-6 bg-white min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-black font-black mb-2 uppercase tracking-widest">
            Article Not Found
          </p>
          <p className="text-gray-600 mb-6">
            This article may have been removed or the link is incorrect.
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

  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");

  const tenantConfig = ADSTERRA_CONFIG.voicejeju;
  const adKeys = tenantConfig.banners;
  const showSkyscrapers = adKeys["160x600"] && adKeys["160x600"].length > 0;
  const midArticleConfig = tenantConfig.midArticle;

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
      <div className="h-2 bg-white border-b border-gray-100" />

      {/* Immersive Header Wrapper */}
      <div className="bg-black text-white pt-8 pb-12 mb-8 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center relative mb-8 gap-6 sm:gap-0 min-h-[40px]">
            <button
              type="button"
              onClick={() =>
                window.history.length > 1 ? router.back() : router.push("/")
              }
              className="sm:absolute sm:left-0 inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/70 hover:text-white transition-all bg-white/5 border border-white/10 px-6 py-2.5 rounded-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {normalizeCategoryName(article.category?.categoryName)
                ? `Back to ${normalizeCategoryName(article.category?.categoryName)}`
                : "Back to feed"}
            </button>

            {normalizeCategoryName(article.category?.categoryName) && (
              <span className="inline-block px-5 py-1.5 bg-white/10 text-white rounded-none text-[10px] font-black uppercase tracking-[0.4em] border border-white/10">
                {normalizeCategoryName(article.category?.categoryName)}
              </span>
            )}
          </div>

          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-normal text-white mb-8 font-voltaire tracking-tighter leading-snug lg:leading-[0.9] uppercase">
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

      {/* Mobile Trending Strip */}
      {trendingArticles.length > 0 && (
        <div className="lg:hidden max-w-[1440px] mx-auto px-4 sm:px-6 mb-6">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">Trending</p>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory">
            {trendingArticles.map((a) => (
              <Link
                key={a.id}
                href={`/article/${a.slug || a.id}`}
                className="flex-shrink-0 w-36 snap-start group"
              >
                <div className="aspect-video relative overflow-hidden mb-2 bg-gray-100">
                  <StoryImage
                    src={a.imageUrl}
                    alt={a.title}
                    fill
                    sizes="144px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] font-bold leading-tight line-clamp-2 text-gray-900 group-hover:underline">
                  {a.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Adsterra Top Leaderboards */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 mb-2">
        <div className="hidden sm:block">
          <AdsterraBanner bannerKey="c242943e75df6497a5929d27852b1159" width={728} height={90} />
        </div>
        <div className="block sm:hidden">
          <AdsterraBanner bannerKey="d68b3e9b0c05a075a85176317f822b6d" width={320} height={50} />
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative">
        {/* Floating Left Gutter Skyscraper */}
        {showSkyscrapers && (
          <div className="hidden min-[1800px]:block absolute right-full mr-6 top-32 bottom-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        )}

        {/* Floating Right Gutter Skyscraper */}
        {showSkyscrapers && (
          <div className="hidden min-[1800px]:block absolute left-full ml-6 top-32 bottom-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">

          {/* Left Sidebar: Trending Stories */}
          <aside className="lg:col-span-3 space-y-8 lg:pr-10 border-r border-gray-100 hidden lg:block">
            <div className="sticky top-32">
              <div className="border-t-4 border-black pt-6 mb-6">
                <TrendingSidebar articles={trendingArticles} domain="voicejeju.com" />
              </div>
              <AdBanner position="ARTICLE_SIDEBAR" />
              <div className="mt-2 flex justify-center">
                <AdsterraBanner bannerKey="1fc758c95674c51a8dc1e7bdff580f7e" width={300} height={250} />
              </div>
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
                  <div className="mb-8 overflow-hidden bg-black aspect-video border border-gray-100">
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
                      <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl border-l-4 border-gray-100 pl-10 mb-8 italic opacity-95">
                        {firstHalf}
                      </div>

                      {/* Adsterra Mid-Article Dynamic Ad */}
                      {midArticleConfig && (
                        <div className="my-8 flex justify-center w-full">
                           <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
                        </div>
                      )}

                      <div className="my-8 overflow-hidden bg-gray-50 relative aspect-video border-y border-gray-100">
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
                    <>
                      <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl">
                        {firstHalf}
                      </div>

                      {/* Adsterra Mid-Article Dynamic Ad */}
                      {midArticleConfig && (
                        <div className="my-8 flex justify-center w-full">
                           <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
                        </div>
                      )}

                      {secondHalf && (
                        <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl mt-4">
                          {secondHalf}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="overflow-hidden bg-gray-50 relative aspect-video lg:aspect-[21/9] border-y border-gray-100 mb-8">
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

                  <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl max-w-4xl mb-8">
                    {firstHalf}
                  </div>

                  {/* Adsterra Mid-Article Dynamic Ad */}
                  {midArticleConfig && (
                    <div className="my-8 flex justify-center w-full">
                       <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
                    </div>
                  )}

                  {secondHalf && (
                    <div className="text-gray-900 leading-[1.8] whitespace-pre-wrap font-inter text-lg lg:text-xl max-w-4xl mb-8 mt-4">
                      {secondHalf}
                    </div>
                  )}
                </>
              )}

              {referenceLine ? (
                <div className="mt-12 pt-8 border-t border-black">
                  <p className="text-[11px] text-black font-black uppercase tracking-[0.5em] mb-6">Source & Reference</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed font-inter border-l-2 border-gray-200 pl-6">
                    {referenceLine}
                  </p>
                </div>
              ) : null}

              {/* Adsterra Native Recommendations Banner */}
              <div className="mt-2">
                <AdsterraNativeBanner domain="voicejeju.com" />
              </div>

              <ArticleShare
                site="voicejeju"
                title={article.title}
                className="mt-12 py-10 border-y border-gray-100"
              />
            </article>
          </div>
        </div>
      </div>

      {/* Recommended Articles Section: Editorial Grid */}
      {recommendedArticles.length > 0 && (
        <section className="bg-black text-white py-12 mt-16">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
            <h2 className="text-[12px] font-black uppercase tracking-[0.6em] mb-10 text-gray-400 text-center">
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
                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-3">{rec.category?.categoryName}</span>
                    <h3 className="text-2xl font-normal font-voltaire mb-3 line-clamp-3 leading-tight group-hover:underline transition-all">
                      {rec.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed italic mb-6">
                      {(() => {
                        const first = (rec.content ?? "").split(/\n+/)[0]?.trim() ?? "";
                        return first.length > 140 ? `${first.slice(0, 140)}…` : first;
                      })()}
                    </p>
                    <div className="mt-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-white transition-colors">
                      <Clock size={12} />
                      <span>{Math.max(1, Math.ceil((rec.content ?? "").trim().split(/\s+/).filter(Boolean).length / 200))} MIN READ</span>
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
