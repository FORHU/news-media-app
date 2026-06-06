"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import dynamic from "next/dynamic";

const FeaturedArticlesSection = dynamic(
  () => import("@/components/home/featured-articles-section").then((m) => m.FeaturedArticlesSection),
  { ssr: true, loading: () => <div className="h-80 animate-pulse bg-gray-100" /> }
);
const TwitterStatusEmbed = dynamic(
  () => import("@/components/article/TwitterStatusEmbed"),
  { ssr: false, loading: () => <div className="h-[450px] animate-pulse bg-gray-100 border border-gray-200" /> }
);

import { StoryImage } from "@/components/StoryImage";
import { AdBanner } from "@/components/AdBanner";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
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
import { ArticleContentRenderer } from "@/components/article/ArticleContentRenderer";

export default function LavagueTechArticle({
  articleId,
  initialOtherArticles = [],
  domain = "lavaguetech.com",
}: {
  articleId: string;
  initialOtherArticles?: Article[];
  domain?: string;
}) {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
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
    if (!lastViewed || now - parseInt(lastViewed) > 5_000) {
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
      <div className="flex items-center justify-center py-32 px-6 bg-white min-h-[60vh]">
        <div className="text-center max-w-md bg-white border border-gray-200 shadow-sm p-10">
          <p className="text-gray-900 font-bold mb-5">We couldn't load this article.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-600 transition-colors bg-blue-50 px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);

  const trendingArticles = [...otherArticles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0))
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  const recommendedArticles = [...otherArticles]
    .sort((a, b) => {
      const aSame = a.categoryId === article.categoryId ? 1 : 0;
      const bSame = b.categoryId === article.categoryId ? 1 : 0;
      if (aSame !== bSame) return bSame - aSame;
      if ((b.trendingScore || 0) !== (a.trendingScore || 0))
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 4);

  const createdAt =
    article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate = createdAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const rawTweet = article.rawTweet;
  const rawVideo = article.rawVideo;
  const youtubeUrl = article.youtubeUrl || rawVideo?.youtubeUrl || null;
  const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  const isCommentaryTweetArticle =
    article.sourceType === "TWEET" && isSocialCommentaryGenerationMode(rawTweet?.generationMode);
  const isCommentaryVideoArticle =
    article.sourceType === "VIDEO" && isSocialCommentaryGenerationMode(rawVideo?.generationMode);
  const showTweetCommentaryEmbed = isCommentaryTweetArticle && Boolean(rawTweet?.tweetId);
  const isCommentaryLayoutArticle = isCommentaryTweetArticle || isCommentaryVideoArticle;

  const bodyContent = isCommentaryLayoutArticle
    ? stripOriginalPostBlock(article.content)
    : article.content;

  const { main: layoutContent, referenceLine } = splitReferenceLineFromContent(
    bodyContent,
    isCommentaryLayoutArticle
  );

  const paragraphs = layoutContent
    .replace(/<[^>]*>/g, "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");

  const config = ADSTERRA_CONFIG["lavaguetech"];
  const midKey = config.midArticle?.key ?? config.banners["300x250"];

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-24 selection:bg-blue-100 relative">

      {/* Gutter skyscrapers — bounded to article content, won't overlap footer */}
      <div className="pointer-events-none absolute inset-0">
        <div className="relative h-full max-w-7xl mx-auto">
          <div className="hidden min-[1650px]:block absolute right-full mr-6 top-32 bottom-0 w-[160px] z-30 pointer-events-auto">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={config.banners["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
          <div className="hidden min-[1650px]:block absolute left-full ml-6 top-32 bottom-0 w-[160px] z-30 pointer-events-auto">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={config.banners["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-gray-100 z-[100]">
        <div
          className="h-full bg-blue-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ── Article Header ────────────────────────────── */}
      <div className="bg-blue-700 border-b border-blue-800 pt-10 pb-14 mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row items-center justify-center relative mb-8 gap-4 sm:gap-0 min-h-[36px]">
            <button
              onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
              className="sm:absolute sm:left-0 inline-flex self-start sm:self-auto items-center gap-2 text-sm text-white/80 hover:text-white transition-colors bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {normalizeCategoryName(article.category?.categoryName) && (
              <span className="inline-block px-4 py-1.5 bg-red-600/90 text-white text-[10px] font-black uppercase tracking-[0.25em] border border-red-500/50">
                {normalizeCategoryName(article.category?.categoryName)}
              </span>
            )}
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-7 leading-tight tracking-tight">
              {article.title}
            </h1>
            <div className="flex items-center justify-center gap-5">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-white/20" />
              <p suppressHydrationWarning className="text-blue-100/80 font-bold tracking-[0.25em] uppercase text-[10px]">
                {formattedDate}
              </p>
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Top article leaderboard */}
      <div className="w-full flex justify-center py-4 border-b border-gray-100 overflow-hidden">
        <div className="hidden sm:block">
          <AdsterraBanner bannerKey={config.banners["728x90"]} width={728} height={90} className="!my-0" />
        </div>
        <div className="block sm:hidden">
          <AdsterraBanner bannerKey={config.banners["320x50"]} width={320} height={50} className="!my-0" />
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Main article col */}
          <div className="lg:col-span-8">
            <article className="bg-white border border-gray-200 shadow-sm p-7 md:p-10">

              {showTweetCommentaryEmbed && rawTweet?.tweetId && (
                <div className="mb-10">
                  <TwitterStatusEmbed tweetId={rawTweet.tweetId} profileUrl={rawTweet.profileUrl} />
                </div>
              )}

              {youtubeId ? (
                <>
                  <div className="mb-8 overflow-hidden bg-black aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="YouTube video player"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                  {article.imageUrl ? (
                    <>
                      <div className="text-gray-700 text-[17px] leading-[1.85] whitespace-pre-wrap mb-8 break-words">{firstHalf}</div>
                      <div className="my-10 flex justify-center border-y border-gray-200 py-5 bg-gray-50">
                        <AdsterraBanner bannerKey={midKey} width={300} height={250} className="!my-0" />
                      </div>
                      <div className="my-10 relative aspect-[16/9] bg-gray-100 overflow-hidden border border-gray-200">
                        <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" sizes="(max-width: 640px) 400px, (max-width: 1024px) 100vw, 850px" />
                      </div>
                      {secondHalf && <div className="text-gray-700 text-[17px] leading-[1.85] whitespace-pre-wrap break-words">{secondHalf}</div>}
                    </>
                  ) : (
                    <>
                      <div className="text-gray-700 text-[17px] leading-[1.85] whitespace-pre-wrap break-words">{firstHalf}</div>
                      <div className="my-10 flex justify-center border-y border-gray-200 py-5 bg-gray-50">
                        <AdsterraBanner bannerKey={midKey} width={300} height={250} className="!my-0" />
                      </div>
                      {secondHalf && <div className="text-gray-700 text-[17px] leading-[1.85] whitespace-pre-wrap break-words mt-6">{secondHalf}</div>}
                    </>
                  )}
                </>
              ) : (
                <>
                  {article.imageUrl && (
                    <div className="mb-10 relative aspect-[16/9] bg-gray-100 overflow-hidden border border-gray-200">
                      <StoryImage src={article.imageUrl} alt={article.title} fill priority className="object-cover" variant="hero" sizes="(max-width: 640px) 400px, (max-width: 1024px) 100vw, 850px" />
                    </div>
                  )}
                  <ArticleContentRenderer
                    paragraphs={paragraphs}
                    galleryImages={(article.imageUrls ?? []).slice(1)}
                    title={article.title}
                    imageWrapperClassName="relative aspect-[16/9] bg-gray-100 overflow-hidden border border-gray-200"
                    textClassName="text-gray-700 text-[17px] leading-[1.85] whitespace-pre-wrap break-words mt-7"
                    adSlot={
                      <div className="my-10 flex justify-center border-y border-gray-200 py-5 bg-gray-50">
                        <AdsterraBanner bannerKey={midKey} width={300} height={250} className="!my-0" />
                      </div>
                    }
                  />
                </>
              )}

              <ArticleShare site="lavaguetech" title={article.title} className="mt-10" />

              {referenceLine && (
                <div className="mt-14 pt-8 border-t border-gray-200 bg-blue-50 p-7 border border-blue-100">
                  <p className="text-[10px] text-blue-700 font-black uppercase tracking-[0.3em] mb-3">
                    Verification Source
                  </p>
                  <p className="text-gray-500 italic text-base leading-relaxed break-all">
                    {referenceLine}
                  </p>
                </div>
              )}
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start space-y-5">

            {/* Tendances — custom numbered list matching search page style */}
            {trendingArticles.length > 0 && (
              <div className="border border-gray-200 overflow-hidden">
                <div className="bg-blue-700 px-4 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Tendances</h3>
                </div>
                <div className="bg-white divide-y divide-gray-100">
                  {trendingArticles.map((art, i) => (
                    <Link
                      key={art.id}
                      href={`/article/${art.slug || art.id}`}
                      className="group flex items-start gap-3 px-4 py-3.5 hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="font-mono text-[18px] font-black leading-none mt-0.5 w-6 flex-shrink-0 text-right text-blue-100 group-hover:text-blue-300 transition-colors tabular-nums">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {art.category?.categoryName && (
                          <span className="text-[8px] font-black uppercase tracking-[0.25em] text-red-500 block mb-1">
                            {art.category.categoryName}
                          </span>
                        )}
                        <h4 className="text-[12px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {art.title}
                        </h4>
                        <span className="text-[9px] text-gray-400 mt-1 block font-mono">
                          {new Date(art.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <AdBanner
              position="ARTICLE_SIDEBAR"
              className="!bg-white !border-gray-200 !p-4 !min-h-[250px]"
            />
            <div className="flex justify-center">
              <AdsterraBanner bannerKey={config.banners["300x250"]} width={300} height={250} className="!my-0" />
            </div>
          </aside>
        </div>

        {/* ── Plus d'articles ──────────────────────────── */}
        {recommendedArticles.length > 0 && (
          <section className="mt-20 border-t-2 border-blue-700 pt-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-5 bg-red-600 flex-shrink-0" />
              <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">
                Plus d&apos;articles
              </h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <FeaturedArticlesSection articles={recommendedArticles} domain={domain} />
          </section>
        )}

        {/* Native sponsored recommendations */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <AdsterraNativeBanner domain="lavaguetech.com" transparent />
        </div>
      </div>
    </main>
  );
}
