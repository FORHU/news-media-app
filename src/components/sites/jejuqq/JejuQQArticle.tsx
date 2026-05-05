"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp } from "lucide-react";

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
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
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-garamond font-bold leading-[1.05] mb-6 tracking-tighter">
                  {article.title}
                </h1>
                <div className="flex items-center justify-between border-y border-gray-200 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-none bg-[#dc2626] flex items-center justify-center text-white font-black text-xs">QQ</div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{formattedDate}</span>
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
                  <div className="prose prose-lg font-garamond max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-gray-700">
                    {article.imageUrl ? (
                      <>
                        <div className="whitespace-pre-wrap mb-10 break-words">{firstHalf}</div>
                        <div className="my-12 relative aspect-[16/9] bg-gray-100 rounded-none overflow-hidden shadow-lg border-2 border-[#dc2626]">
                          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" />
                        </div>
                        {secondHalf && <div className="whitespace-pre-wrap break-words">{secondHalf}</div>}
                      </>
                    ) : (
                      <div className="whitespace-pre-wrap">{fullContent}</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {article.imageUrl && (
                    <div className="mb-10 relative aspect-[16/9] bg-gray-100 rounded-none overflow-hidden shadow-lg border-2 border-[#dc2626]">
                      <StoryImage src={article.imageUrl} alt={article.title} fill priority className="object-cover" variant="hero" />
                    </div>
                  )}
                  <div className="prose prose-lg font-garamond max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-gray-700 whitespace-pre-wrap break-words">
                    {fullContent}
                  </div>
                </>
              )}

              {referenceLine && (
                <div className="mt-16 pt-10 border-t border-gray-100">
                  <p className="text-sm text-gray-600 font-bold uppercase tracking-[0.2em] mb-4">Original Reference</p>
                  <p className="text-gray-600 font-garamond italic text-lg leading-relaxed break-all">
                    {referenceLine}
                  </p>
                </div>
              )}

            </article>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="bg-gray-50 rounded-none p-6 border-2 border-[#dc2626] lg:sticky lg:top-28">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-200">
                 <h3 className="text-xl font-garamond font-bold flex items-center gap-2">
                    Trending <TrendingUp size={20} className="text-[#b91c1c]" />
                 </h3>
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
                         <h4 className="text-[15px] font-bold leading-snug group-hover:text-[#b91c1c] transition-colors line-clamp-2">
                            {article.title}
                         </h4>
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
