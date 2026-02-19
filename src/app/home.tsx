"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { NewsletterModal } from "@/components/NewsletterModal";
import { HeroSection } from "@/components/HeroSection";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { Footer } from "@/components/Footer";
import { articlesApi } from "@/lib/api";
import type { Article } from "@/lib/types";

export default function Home() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search");
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

  // Filter articles based on search query
  const filteredArticles = searchQuery
    ? articles.filter((article) => {
        const query = searchQuery.toLowerCase();
        const content = article.content?.toLowerCase() ?? "";
        return (
          article.title.toLowerCase().includes(query) ||
          content.includes(query) ||
          article.category.categoryName.toLowerCase().includes(query)
        );
      })
    : articles;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ff4500] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onOpenNewsletter={() => setIsNewsletterOpen(true)} />
      <NavBar />

      {/* Hero Section - Carousel */}
      {!searchQuery && filteredArticles.length > 0 && (
        <HeroSection articles={filteredArticles.slice(0, 5)} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Status Bar */}
        {searchQuery && (
          <FilterStatusBar
            searchQuery={searchQuery}
            resultCount={filteredArticles.length}
          />
        )}

        {/* Two-Column Layout: Latest Stories + Trending Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <LatestStoriesSection
            articles={filteredArticles}
            error={error}
            searchQuery={searchQuery}
          />
          <TrendingSidebar articles={filteredArticles.slice(0, 5)} />
        </div>

        {/* Featured Articles Grid */}
        {!searchQuery && (
          <FeaturedArticlesSection
            articles={filteredArticles.slice(0, 4)}
          />
        )}

        {/* Trending Products Section */}
        {!searchQuery && (
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
