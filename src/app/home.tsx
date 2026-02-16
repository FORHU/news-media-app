"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { HeroSection } from "@/components/HeroSection";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { articlesApi, adminApi } from "@/lib/api";
import type { Article } from "@/lib/types";

export default function Home() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search");

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadArticles();
    adminApi.initialize().catch(() => {});
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await articlesApi.getArticles({ limit: 50 });
      setArticles(data);
    } catch {
      setError("Failed to load articles");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter articles based on search query
  const filteredArticles = searchQuery
    ? articles.filter((article) => {
        const query = searchQuery.toLowerCase();
        return (
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query) ||
          article.category.toLowerCase().includes(query)
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
      <Header />
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
              .filter((a) => a.type === "blog")
              .slice(0, 4)}
          />
        )}
      </main>
    </div>
  );
}
