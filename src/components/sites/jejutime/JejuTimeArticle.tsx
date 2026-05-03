"use client";

import { useState, useEffect } from "react";
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

export default function JejuTimeArticle({ 
  articleId, 
  initialOtherArticles = [],
  domain = "jejutime.com"
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
      const progress = (window.scrollY / totalHeight) * 100;
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
        <div className="text-center max-w-md bg-white p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
          <p className="text-slate-800 font-semibold mb-4">We couldn’t load this article.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-full">
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
  const youtubeId = article.youtubeUrl ? extractYoutubeId(article.youtubeUrl) : null;
  const paragraphs = article.content.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const fullContent = paragraphs.join("\n\n");
  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#2D3748] font-roboto selection:bg-blue-100 pb-20">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-blue-50 z-[100]">
        <div 
          className="h-full bg-blue-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      {/* Immersive Header Wrapper */}
      <div className="bg-white border-b border-blue-100 pt-8 pb-12 shadow-sm mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center justify-center relative mb-8 min-h-[40px]">
                <button 
                  onClick={() => window.history.length > 1 ? router.back() : router.push("/")} 
                  className="absolute left-0 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 px-4 py-2 rounded-full hover:bg-blue-50"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                
                {normalizeCategoryName(article.category?.categoryName) && (
                    <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm border border-blue-100">
                    {normalizeCategoryName(article.category?.categoryName)}
                    </span>
                )}
            </div>

            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-slate-900 mb-6 leading-tight">
                    {article.title}
                </h1>
                <p className="text-slate-500 font-medium tracking-wide">{formattedDate}</p>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
            <article className="bg-white p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
                {youtubeId ? (
                <>
                    <div className="mb-10 overflow-hidden bg-slate-900 aspect-video shadow-lg ring-1 ring-black/5">
                    <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video player" allowFullScreen className="w-full h-full border-0" />
                    </div>
                    {article.imageUrl ? (
                      <>
                        <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap mb-10">{firstHalf}</div>
                        <div className="my-12 relative aspect-[16/9] bg-slate-100 overflow-hidden shadow-lg ring-1 ring-black/5">
                        <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" />
                        </div>
                        {secondHalf && <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">{secondHalf}</div>}
                      </>
                    ) : (
                      <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-light">
                        {fullContent}
                      </div>
                    )}
                </>
                ) : (
                <>
                    {article.imageUrl && (
                      <div className="mb-12 -mt-4 relative aspect-[16/9] bg-slate-100 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
                      <StoryImage src={article.imageUrl} alt={article.title} fill priority className="object-cover" variant="hero" />
                      </div>
                    )}
                    <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-light">
                    {fullContent}
                    </div>
                </>
                )}
            </article>
            </div>

            <div className="lg:col-span-4 space-y-8">
            <div className="bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 border border-slate-100">
                <TrendingSidebar articles={trendingArticles} domain={domain} />
            </div>
            <AdBanner 
              position="ARTICLE_SIDEBAR" 
              className="!bg-white !shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] !p-4 !border-slate-100 !rounded-none !min-h-[250px]" 
            />
            </div>
        </div>

        {recommendedArticles.length > 0 && (
            <div className="mt-20">
            <h2 className="text-3xl font-playfair font-bold text-slate-900 mb-8 text-center">
                Recommended For You
            </h2>
            <FeaturedArticlesSection articles={recommendedArticles} domain="jejutime.com" />
            </div>
        )}
      </div>
    </main>
  );
}
