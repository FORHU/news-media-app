"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { ArrowLeft, Loader2 } from "lucide-react";
import { articlesApi } from "@/lib/api";

export default function ArticlePage() {
  const params = useParams();
  const idParam = params?.id as string | undefined;
  const numId = idParam ? parseInt(idParam, 10) : NaN;
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article", numId],
    queryFn: () => articlesApi.getArticle(numId),
    enabled: !Number.isNaN(numId),
  });

  const { data: allArticles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesApi.getArticles({ limit: 50 }),
  });

  if (Number.isNaN(numId) || (isError && !isLoading)) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ff4500] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    notFound();
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
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#ff4500] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

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
                  <div className="mt-6 rounded-xl overflow-hidden bg-gray-200">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-auto object-cover"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended articles</h2>
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
