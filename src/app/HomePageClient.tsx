"use client";

import { useState } from "react";
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
import type { Article } from "@/lib/types";

interface HomePageClientProps {
  articles: Article[];
  searchQuery: string | null;
  categoryParam: string | null;
  error?: string;
}

export function HomePageClient({
  articles,
  searchQuery,
  categoryParam,
  error = "",
}: HomePageClientProps) {
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Header onOpenNewsletter={() => setIsNewsletterOpen(true)} />
      <NavBar />

      {!searchQuery && !categoryParam && articles.length > 0 && (
        <HeroSection articles={articles.slice(0, 5)} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(searchQuery || categoryParam) && (
          <FilterStatusBar
            searchQuery={searchQuery}
            categoryName={categoryParam}
            resultCount={articles.length}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <LatestStoriesSection
            articles={articles}
            error={error}
            searchQuery={searchQuery}
          />
          <TrendingSidebar articles={articles.slice(0, 5)} />
        </div>

        {!searchQuery && !categoryParam && (
          <FeaturedArticlesSection articles={articles.slice(0, 4)} />
        )}

        {!searchQuery && !categoryParam && (
          <TrendingProductsSection
            articles={articles
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

