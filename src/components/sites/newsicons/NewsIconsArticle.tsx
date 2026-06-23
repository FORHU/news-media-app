"use client";

import { useEffect } from "react";
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
import { ArticleImageGallery } from "@/components/article/ArticleImageGallery";

const config = ADSTERRA_CONFIG.newsicons;

export default function NewsIconsArticle({
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
    isError,
  } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  const allArticles = initialOtherArticles;

  if (isError || !article) {
    return (
      <div className="flex items-center justify-center py-32 px-6">
        <div className="text-center max-w-md">
          <p className="text-gray-900 font-semibold mb-2">
            We couldn&apos;t load this article.
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

  const midArticleAd = (
    <div className="my-10 flex justify-center border-y border-slate-100 py-6 bg-slate-50/50">
      <AdsterraBanner
        bannerKey={config.midArticle!.key}
        width={config.midArticle!.width}
        height={config.midArticle!.height}
        className="!my-0"
      />
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 relative">
      {/* Left gutter skyscraper */}
      <div className="hidden min-[1650px]:block absolute right-full mr-6 top-32 bottom-32 w-[160px] z-30">
        <div className="sticky top-40">
          <AdsterraBanner bannerKey={config.banners["160x600"]} width={160} height={600} />
        </div>
      </div>
      {/* Right gutter skyscraper */}
      <div className="hidden min-[1650px]:block absolute left-full ml-6 top-32 bottom-32 w-[160px] z-30">
        <div className="sticky top-40">
          <AdsterraBanner bannerKey={config.banners["160x600"]} width={160} height={600} />
        </div>
      </div>

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
              <div className="mt-8 mb-10">
                <TwitterStatusEmbed
                  tweetId={rawTweet.tweetId}
                  profileUrl={rawTweet.profileUrl}
                />
              </div>
            ) : null}

            {showYoutubePlayer ? (
              <>
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
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {firstHalf}
                    </div>

                    {midArticleAd}

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
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Reference</p>
                    <p className="text-sm text-gray-500 italic leading-relaxed">
                      {referenceLine}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <>
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

                <div className="mt-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {firstHalf}
                </div>

                {midArticleAd}

                <ArticleImageGallery
                  images={article.imageUrls ?? []}
                  title={article.title}
                  imageWrapperClassName="rounded-xl overflow-hidden bg-gray-200 relative aspect-video shadow-sm"
                />

                {secondHalf && (
                  <div className="mt-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {secondHalf}
                  </div>
                )}
                {referenceLine ? (
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Reference</p>
                    <p className="text-sm text-gray-500 italic leading-relaxed">
                      {referenceLine}
                    </p>
                  </div>
                ) : null}
              </>
            )}

            {/* Native banner below article */}
            <div className="mt-8">
              <AdsterraNativeBanner domain="newsicons.com" />
            </div>

            <ArticleShare
              site="newsicons"
              title={article.title}
              className="mt-12"
            />
          </article>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <TrendingSidebar articles={trendingArticles} domain="newsicons.com" />
          <AdBanner position="ARTICLE_SIDEBAR" />
          <div className="bg-white p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
            <AdsterraBanner bannerKey={config.banners["300x250"]} width={300} height={250} />
          </div>
        </div>
      </div>

      {recommendedArticles.length > 0 && (
        <div className="mt-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recommended articles
          </h2>
          <FeaturedArticlesSection articles={recommendedArticles} domain="newsicons.com" />
        </div>
      )}
    </main>
  );
}
