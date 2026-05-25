"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp } from "lucide-react";

import dynamic from "next/dynamic";
const AdBanner = dynamic(() => import("@/components/AdBanner").then(mod => mod.AdBanner), {
  ssr: true,
  loading: () => <div className="h-[250px] animate-pulse bg-slate-50 flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase tracking-widest border border-slate-100" />
});
const TwitterStatusEmbed = dynamic(() => import("@/components/article/TwitterStatusEmbed"), {
  ssr: false,
  loading: () => <div className="h-[450px] animate-pulse bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest border border-slate-100" />
});
const FeaturedArticlesSection = dynamic(() => import("@/components/home/featured-articles-section").then(mod => mod.FeaturedArticlesSection), {
  ssr: true,
  loading: () => <div className="h-96 animate-pulse bg-slate-50" />
});

import { StoryImage } from "@/components/StoryImage";
import { articlesApi } from "@/lib/api";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import type { Article } from "@/lib/types";
import { extractYoutubeId } from "@/lib/utils";
import {
  isSocialCommentaryGenerationMode,
  splitReferenceLineFromContent,
  stripOriginalPostBlock,
} from "@/lib/tweetArticleDisplay";
import { ArticleShare } from "@/components/article/ArticleShare";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";


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
  const tenantConfig = ADSTERRA_CONFIG.jejuqq;
  const adKeys = tenantConfig.banners;
  const showSkyscrapers = adKeys["160x600"] && adKeys["160x600"].length > 0;
  const midArticleConfig = tenantConfig.midArticle;

  useEffect(() => {
    window.scrollTo(0, 0);

    // Smart View Tracking
    const lastViewed = localStorage.getItem(`viewed_${articleId}`);
    const now = Date.now();
    const lockTime = 5 * 1000; // 5 seconds

    if (!lastViewed || now - parseInt(lastViewed) > lockTime) {
      articlesApi.recordView(articleId).catch(console.error);
      localStorage.setItem(`viewed_${articleId}`, now.toString());
    }
  }, [articleId]);

  const { data: article, isError } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  if (isError || !article) {
    return (
      <div className="flex items-center justify-center py-32 px-6">
        <div className="text-center max-w-md">
          <p className="text-[#222] font-black mb-2 uppercase tracking-widest">We couldn't load this article.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#b91c1c] transition-colors font-bold uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);

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
      // 1. Same category priority
      const aSameCat = a.categoryId === article.categoryId ? 1 : 0;
      const bSameCat = b.categoryId === article.categoryId ? 1 : 0;
      if (aSameCat !== bSameCat) return bSameCat - aSameCat;

      // 2. Trending score
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }

      // 3. Date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 4);

  const createdAt = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate = createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const rawTweet = article.rawTweet;
  const rawVideo = article.rawVideo;
  const youtubeUrl = article.youtubeUrl || rawVideo?.youtubeUrl || null;
  const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  const isCommentaryTweetArticle =
    article.sourceType === "TWEET" &&
    isSocialCommentaryGenerationMode(rawTweet?.generationMode);

  const isCommentaryVideoArticle =
    article.sourceType === "VIDEO" &&
    isSocialCommentaryGenerationMode(rawVideo?.generationMode);

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

  const paragraphs = layoutContent.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const fullContent = paragraphs.join("\n\n");
  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");


  return (
    <div className="bg-[#fdf2f2] text-[#222] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative">
        {/* Floating Left Gutter Skyscraper */}
        {showSkyscrapers && (
          <div className="hidden min-[1650px]:block absolute right-full mr-6 top-32 bottom-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        )}

        {/* Floating Right Gutter Skyscraper */}
        {showSkyscrapers && (
          <div className="hidden min-[1650px]:block absolute left-full ml-6 top-32 bottom-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        )}

        {/* Top Leaderboard */}
        {adKeys["728x90"] && adKeys["320x50"] && (
          <div className="w-full flex justify-center mb-6 overflow-hidden">
            <div className="hidden sm:block">
              <AdsterraBanner bannerKey={adKeys["728x90"]} width={728} height={90} className="!my-0" />
            </div>
            <div className="block sm:hidden">
              <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} className="!my-0" />
            </div>
          </div>
        )}
        <button onClick={() => window.history.length > 1 ? router.back() : router.push("/")} className="inline-flex items-center gap-3 text-xs text-gray-600 hover:text-[#b91c1c] mb-8 transition-colors group font-black uppercase tracking-[0.3em]">
          <div className="w-8 h-8 rounded-none border border-gray-200 flex items-center justify-center group-hover:border-[#b91c1c] group-hover:bg-[#b91c1c] group-hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to feed
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-8">
            <article>
              <header className="mb-10">
                {normalizeCategoryName(article.category?.categoryName) && (
                  <div className="flex items-center gap-3 mb-5">
                    <span className="h-0.5 w-10 bg-[#dc2626]"></span>
                    <span className="text-[12px] text-[#b91c1c] font-black uppercase tracking-[0.4em]">
                      {normalizeCategoryName(article.category?.categoryName)}
                    </span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-garamond font-bold leading-[1.05] mb-6 tracking-tighter break-words">
                  {article.title}
                </h1>
                <div className="flex items-center justify-between border-y border-gray-200 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-none bg-[#dc2626] flex items-center justify-center text-white font-black text-xs">QQ</div>
                    <span suppressHydrationWarning className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{formattedDate}</span>
                  </div>
                </div>
              </header>

              {showTweetCommentaryEmbed && rawTweet?.tweetId ? (
                <div className="mb-12">
                  <TwitterStatusEmbed
                    tweetId={rawTweet.tweetId}
                    profileUrl={rawTweet.profileUrl}
                  />
                </div>
              ) : null}

              {youtubeId ? (
                <>
                  <div className="mb-10 bg-black aspect-video rounded-none overflow-hidden shadow-lg border-2 border-[#dc2626]">
                    <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video player" allowFullScreen className="w-full h-full border-0" />
                  </div>
                  <div className="prose prose-lg font-garamond max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-gray-900">
                    {article.imageUrl ? (
                      <>
                        <div className="whitespace-pre-wrap mb-10 break-words">{firstHalf}</div>
                        {midArticleConfig && (
                          <div className="my-2 py-2 flex justify-center w-full">
                            <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
                          </div>
                        )}
                        <div className="my-12 relative aspect-[16/9] bg-gray-100 rounded-none overflow-hidden shadow-lg border-2 border-[#dc2626]">
                          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" sizes="(max-width: 1024px) 100vw, 850px" />
                        </div>
                        {secondHalf && <div className="whitespace-pre-wrap break-words">{secondHalf}</div>}
                      </>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap mb-10 break-words">{firstHalf}</div>
                        {midArticleConfig && (
                          <div className="my-2 py-2 flex justify-center w-full">
                            <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
                          </div>
                        )}
                        {secondHalf && <div className="whitespace-pre-wrap break-words">{secondHalf}</div>}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {article.imageUrl && (
                    <div className="mb-10 relative aspect-[16/9] bg-gray-100 rounded-none overflow-hidden shadow-lg border-2 border-[#dc2626]">
                      <StoryImage src={article.imageUrl} alt={article.title} fill priority className="object-cover" variant="hero" sizes="(max-width: 1024px) 100vw, 850px" />
                    </div>
                  )}
                  <div className="prose prose-lg font-garamond max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-gray-900 whitespace-pre-wrap break-words">
                    <div className="whitespace-pre-wrap mb-10 break-words">{firstHalf}</div>
                    {midArticleConfig && (
                      <div className="my-2 py-2 flex justify-center w-full">
                        <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
                      </div>
                    )}
                    {secondHalf && <div className="whitespace-pre-wrap break-words">{secondHalf}</div>}
                  </div>
                </>
              )}

              <ArticleShare
                site="jejuqq"
                title={article.title}
                className="mt-12"
              />

              {referenceLine && (
                <div className="mt-16 pt-10 border-t border-gray-100">
                  <p className="text-sm text-gray-600 font-bold uppercase tracking-[0.2em] mb-4">Original Reference</p>
                  <p className="text-gray-600 font-garamond italic text-lg leading-relaxed break-words">
                    {referenceLine}
                  </p>
                </div>
              )}

            </article>

            {/* Bottom Native Recommendations Widget */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <AdsterraNativeBanner domain="jejuqq.com" />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="bg-gray-50 rounded-none p-6 border-2 border-[#dc2626] lg:sticky lg:top-28">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-200">
                <h2 className="text-xl font-garamond font-bold flex items-center gap-2">
                  Trending <TrendingUp size={20} className="text-[#b91c1c]" />
                </h2>
                <span className="w-2 h-2 bg-[#dc2626]"></span>
              </div>

              <div className="space-y-7">
                {trendingArticles.map((article, i) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex gap-4 items-start group">
                    <span className="text-3xl font-garamond font-bold text-[#b91c1c]/80 group-hover:text-[#b91c1c] transition-colors tabular-nums shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-[#b91c1c] uppercase tracking-[0.2em] block mb-1">{article.category?.categoryName}</span>
                      <h3 className="text-[15px] font-bold leading-snug group-hover:text-[#b91c1c] transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-none overflow-hidden">
              <AdBanner position="ARTICLE_SIDEBAR" />
            </div>
          </div>
        </div>

        {recommendedArticles.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200 lg:mt-24 lg:pt-16">
            <div className="flex items-center justify-center gap-6 mb-10">
              <div className="h-0.5 w-16 bg-gray-200"></div>
              <h2 className="text-2xl md:text-3xl font-garamond font-bold uppercase tracking-tight text-center">
                More to Discover
              </h2>
              <div className="h-0.5 w-16 bg-gray-200"></div>
            </div>
            <FeaturedArticlesSection articles={recommendedArticles} domain="jejuqq.com" />
          </div>
        )}
      </main>
    </div>
  );
}
