"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { articlesApi } from "@/lib/api";

function getFallbackImage(title: string) {
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
  const color = colors[Math.max(0, title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length];
  const svg = `
    <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <foreignObject x="50" y="50" width="700" height="300">
        <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%; display:flex; align-items:center; justify-content:center; text-align:center; color:white; font-family:sans-serif; font-size:36px; font-weight:bold; line-height:1.4; overflow:hidden;">
          ${title}
        </div>
      </foreignObject>
    </svg>
  `.trim().replace(/\n/g, '').replace(/"/g, "'");
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function ArticlePageClient({ articleId }: { articleId: string }) {
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const router = useRouter();

  // Prefetch the home page so "Back to Home" is instant
  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  useEffect(() => {
    if (article?.imageUrl) {
      setImgSrc(article.imageUrl);
    }
  }, [article?.imageUrl]);

  const { data: allArticles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesApi.getArticles({ limit: 50 }),
  });

  // We remove the full-page loading state to ensure a seamless transition.
  // The article data is populated via SSR hydration.

  if (isError || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
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

  return (
    <div
      className={
        isNewsletterOpen
          ? "overflow-hidden h-screen bg-white"
          : "min-h-screen bg-white"
      }
    >
      <Header onOpenNewsletter={() => setIsNewsletterOpen(true)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={() => window.history.length > 1 ? router.back() : router.push('/')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#ff4500] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <article>
              <header>
                <span className="inline-block px-2 py-0.5 bg-[#ff4500] text-white rounded text-xs font-semibold uppercase mb-4">
                  {article.category.categoryName}
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {article.title}
                </h1>
                <p className="text-gray-500">{formattedDate}</p>
                {article.imageUrl && (
                  <div className="mt-6 rounded-xl overflow-hidden bg-gray-200 relative aspect-video">
                    <Image
                      src={imgSrc || getFallbackImage(article.title)}
                      alt={article.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 80vw"
                      priority
                      className="object-cover"
                      onError={() => setImgSrc(getFallbackImage(article.title))}
                    />
                  </div>
                )}
              </header>
              <div className="mt-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {article.content}
              </div>
            </article>
          </div>

          <div className="lg:col-span-1">
            <TrendingSidebar articles={trendingArticles} />
          </div>
        </div>

        {recommendedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recommended articles
            </h2>
            <FeaturedArticlesSection articles={recommendedArticles} />
          </div>
        )}
      </main>
      <Footer onOpenNewsletter={() => setIsNewsletterOpen(true)} />
      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={() => setIsNewsletterOpen(false)}
      />
    </div>
  );
}

