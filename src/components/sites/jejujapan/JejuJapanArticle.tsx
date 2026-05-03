"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Clock, ChevronRight } from "lucide-react";

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
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 bg-white font-sans selection:bg-[#bc002d]/10">
      {/* Reading Progress Bar (Left-to-Right) */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-white/10 z-[100] pointer-events-none">
        <div 
          className="h-full bg-[#bc002d] transition-all duration-150 ease-out shadow-[0_0_8px_rgba(188,0,45,0.4)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <button onClick={() => window.history.length > 1 ? router.back() : router.push("/")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#bc002d] mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
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

            {referenceLine && (
              <div className="mt-16 pt-10 border-t-2 border-gray-100">
                <p className="text-[10px] text-[#bc002d] font-bold uppercase tracking-[0.4em] mb-4">Official Source</p>
                <p className="text-gray-600 font-serif italic text-lg leading-relaxed bg-gray-50 p-6 border-l-4 border-[#bc002d]">
                  {referenceLine}
                </p>
              </div>
            )}

          </article>
        </div>

        <div className="lg:col-span-1 space-y-10">
          <div className="bg-[#111] text-white p-8 shadow-2xl">
            <h3 className="text-lg font-serif font-black flex items-center gap-2 mb-8 uppercase tracking-widest border-b border-white/20 pb-4">
               <TrendingUp size={20} className="text-[#bc002d]" /> Trending
            </h3>
            <div className="space-y-8">
               {trendingArticles.map((article, i) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                     <div className="flex gap-4">
                        <span className="text-4xl font-serif font-black text-white/10 group-hover:text-[#bc002d] transition-colors duration-500 shrink-0">0{i + 1}</span>
                        <div>
                           <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] block mb-1.5">{article.category?.categoryName}</span>
                           <h4 className="text-sm font-bold leading-snug group-hover:text-white/80 line-clamp-2 transition-colors">{article.title}</h4>
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
          </div>
          <AdBanner position="ARTICLE_SIDEBAR" className="!rounded-none shadow-sm" />
        </div>
      </div>

      {recommendedArticles.length > 0 && (
        <section className="mt-24 bg-[#111] text-white p-12 lg:p-16 relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
           <div className="absolute top-0 right-0 w-96 h-96 bg-[#bc002d]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
           
           <div className="flex items-center justify-between mb-12 relative z-10 border-b border-white/10 pb-8">
              <h3 className="text-3xl font-serif font-black uppercase tracking-[0.2em] flex items-center gap-4">
                 <TrendingUp size={28} className="text-[#bc002d]" />
                 Featured Report
              </h3>
              <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:text-[#bc002d] transition-all group">
                View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
              {recommendedArticles.map((article, i) => (
                 <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                    <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-white/5 shadow-2xl">
                       <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                       <span className="absolute bottom-4 left-4 text-5xl font-serif font-black text-white/10 group-hover:text-[#bc002d] transition-all duration-500 transform group-hover:-translate-y-2">0{i + 1}</span>
                    </div>
                    <span className="text-[10px] text-[#bc002d] font-black uppercase mb-3 block tracking-[0.3em]">{article.category?.categoryName}</span>
                    <h4 className="text-xl font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h4>
                 </Link>
              ))}
           </div>
        </section>
      )}
    </main>
  );
}
