"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, ChevronRight } from "lucide-react";

import dynamic from "next/dynamic";
const AdBanner = dynamic(() => import("@/components/AdBanner").then(mod => mod.AdBanner), { 
  ssr: true,
  loading: () => <div className="h-[250px] animate-pulse bg-slate-50 flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase tracking-widest border border-slate-100" />
});
const TwitterStatusEmbed = dynamic(() => import("@/components/article/TwitterStatusEmbed"), { 
  ssr: false,
  loading: () => <div className="h-[450px] animate-pulse bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest border border-slate-100" />
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
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Pure DOM scroll progress — no state, no re-renders
  useEffect(() => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) { bar.style.width = "0%"; return; }
      const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
      bar.style.width = `${progress}%`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          <p className="text-gray-900 font-semibold mb-2">We couldn't load this article.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#bc002d] transition-colors">
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 bg-white font-sans selection:bg-[#bc002d]/10">
      {/* Reading Progress Bar — pure DOM, zero re-renders */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-transparent z-[100] pointer-events-none">
        <div 
          ref={progressBarRef}
          className="h-full bg-[#bc002d]"
          style={{ width: "0%", transition: "width 0.1s linear" }}
        />
      </div>

      <button onClick={() => window.history.length > 1 ? router.back() : router.push("/")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#bc002d] mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          <article>
            <header className="mb-8 border-b-2 border-gray-100 pb-8">
              {normalizeCategoryName(article.category?.categoryName) && (
                <span className="inline-block px-3 py-1 bg-[#bc002d] text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                  {normalizeCategoryName(article.category?.categoryName)}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-noto font-black text-black mb-6 leading-tight">
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
                    <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap font-noto mb-8 break-words">{firstHalf}</div>
                    <div className="my-10 relative aspect-[21/9] bg-gray-100">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" sizes="(max-width: 1024px) 100vw, 850px" />
                    </div>
                    {secondHalf && <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap font-noto break-words">{secondHalf}</div>}
                  </>
                ) : (
                  <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap font-noto first-letter:text-6xl first-letter:font-black first-letter:text-[#bc002d] first-letter:float-left first-letter:mr-3 break-words">
                    {fullContent}
                  </div>
                )}
              </>
            ) : (
              <>
                {article.imageUrl && (
                  <div className="mb-10 relative aspect-[21/9] bg-gray-100">
                    <StoryImage src={article.imageUrl} alt={article.title} fill priority className="object-cover" variant="hero" sizes="(max-width: 1024px) 100vw, 850px" />
                  </div>
                )}
                <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap font-noto first-letter:text-6xl first-letter:font-black first-letter:text-[#bc002d] first-letter:float-left first-letter:mr-3 break-words">
                  {fullContent}
                </div>
              </>
            )}

            <ArticleShare 
              site="jejujapan" 
              title={article.title} 
              className="mt-12"
            />

            {referenceLine && (
              <div className="mt-16 pt-10 border-t-2 border-gray-100">
                <p className="text-[10px] text-[#bc002d] font-bold uppercase tracking-[0.4em] mb-4">Official Source</p>
                <p className="text-gray-600 font-noto italic text-lg leading-relaxed bg-gray-50 p-6 border-l-4 border-[#bc002d] break-all">
                  {referenceLine}
                </p>
              </div>
            )}

          </article>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#111] text-white p-6 lg:sticky lg:top-28">
            <h2 className="text-base font-noto font-black flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-white/20 pb-4">
               <TrendingUp size={18} className="text-[#bc002d]" /> Trending
            </h2>
            <div className="space-y-6">
               {trendingArticles.map((article, i) => (
                  <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block group">
                     <div className="flex gap-4">
                        <span className="text-3xl font-noto font-black text-white/10 group-hover:text-[#bc002d] transition-colors shrink-0">0{i + 1}</span>
                        <div className="min-w-0">
                           <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] block mb-1">{article.category?.categoryName}</span>
                           <h3 className="text-sm font-bold leading-snug group-hover:text-white/80 line-clamp-2 transition-colors">{article.title}</h3>
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
        <section className="mt-12 md:mt-20 bg-[#111] text-white p-8 md:p-12 lg:p-14 relative overflow-hidden">
           <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-noto font-black uppercase tracking-[0.1em] flex items-center gap-3">
                 <TrendingUp size={22} className="text-[#bc002d]" />
                 More to Discover
              </h2>
              <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 hover:text-[#bc002d] transition-colors">
                View All <ChevronRight size={14} />
              </Link>
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10">
              {recommendedArticles.map((article, i) => (
                 <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                    <div className="relative aspect-[16/10] overflow-hidden mb-4 bg-white/5">
                       <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                       <span className="absolute bottom-3 left-3 text-4xl font-noto font-black text-white/10 group-hover:text-[#bc002d] transition-colors">0{i + 1}</span>
                    </div>
                    <span className="text-[10px] text-[#bc002d] font-black uppercase mb-2 block tracking-[0.3em]">{article.category?.categoryName}</span>
                    <h3 className="text-base md:text-lg font-bold leading-tight group-hover:text-[#bc002d] transition-colors line-clamp-2">{article.title}</h3>
                 </Link>
              ))}
           </div>
        </section>
      )}
    </main>
  );
}
