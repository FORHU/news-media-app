"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";
import { HeroSection } from "@/components/HeroSection";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { Footer } from "@/components/Footer";
import { articlesApi } from "@/lib/api";

function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search");
  const categoryParam = searchParams.get("category");
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  const {
    data: articles = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesApi.getArticles({ limit: 50 }),
  });

  const error = queryError ? "Failed to load articles" : "";

  // Filter articles by category and/or search
  let filteredArticles = articles;
  if (categoryParam) {
    filteredArticles = filteredArticles.filter(
      (article) => article.category.categoryName === categoryParam
    );
  }
  if (searchQuery) {
    filteredArticles = filteredArticles.filter((article) => {
      const query = searchQuery.toLowerCase();
      const content = article.content?.toLowerCase() ?? "";
      return (
        article.title.toLowerCase().includes(query) ||
        content.includes(query) ||
        article.category.categoryName.toLowerCase().includes(query)
      );
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onOpenNewsletter={() => setIsNewsletterOpen(true)} />
      <NavBar />

      {/* Hero Section - Carousel with trending sidebar & recommendations */}
      {!searchQuery && !categoryParam && filteredArticles.length > 0 && (
        <HeroSection articles={filteredArticles.slice(0, 5)} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Status Bar */}
        {(searchQuery || categoryParam) && (
          <FilterStatusBar
            searchQuery={searchQuery}
            categoryName={categoryParam}
            resultCount={filteredArticles.length}
          />
        )}

        {/* Two-Column Layout: Latest Stories + Trending Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <LatestStoriesSection
            articles={filteredArticles}
            error={error}
            searchQuery={searchQuery}
            isLoading={loading}
          />
          <TrendingSidebar articles={filteredArticles.slice(0, 5)} />
        </div>

        {/* Featured Articles Grid */}
        {!searchQuery && !categoryParam && (
          <FeaturedArticlesSection
            articles={filteredArticles.slice(0, 4)}
          />
        )}

        {/* Trending Products Section */}
        {!searchQuery && !categoryParam && (
          <TrendingProductsSection
            articles={filteredArticles
              .filter((a) => a.status === "blog")
              .slice(0, 4)}
          />
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

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

