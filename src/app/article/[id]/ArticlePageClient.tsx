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
import { StoryImage } from "@/components/StoryImage";
import { articlesApi } from "@/lib/api";

export default function ArticlePageClient({ articleId }: { articleId: string }) {
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
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

  const youtubeUrl = article.youtubeUrl;
  const youtubeId = youtubeUrl
    ? (youtubeUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
      ) || [])[1] ?? null
    : null;

  // Split content into paragraphs so we can insert the YouTube embed mid-article
  const paragraphs = article.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // If there's no YouTube video, we don't need to split the content.
  // This prevents the "glued paragraph" issue between the first and second half containers.
  const hasYoutube = Boolean(youtubeId);
  const midpoint = hasYoutube ? Math.ceil(paragraphs.length / 2) : paragraphs.length;
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = hasYoutube ? paragraphs.slice(midpoint).join("\n\n") : "";

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
              {/* ── Header: category, title, date ── */}
              <header>
                <span className="inline-block px-2 py-0.5 bg-[#ff4500] text-white rounded text-xs font-semibold uppercase mb-4">
                  {article.category.categoryName}
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {article.title}
                </h1>
                <p className="text-gray-500">{formattedDate}</p>
              </header>

              {/* ── Hero image — always shown at the top ── */}
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

              {/* ── Article content — first half ── */}
              <div className="mt-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {firstHalf}
              </div>

              {/* ── YouTube embed — mid-article, only when available ── */}
              {youtubeId && (
                <div className="my-8 rounded-xl overflow-hidden bg-black aspect-video shadow-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* ── Article content — second half ── */}
              {secondHalf && (
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {secondHalf}
                </div>
              )}
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

