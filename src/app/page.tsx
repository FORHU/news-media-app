import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { HeroSection } from "@/components/HeroSection";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { articlesService } from "@/app/api/services/articles.service";

export default async function Page({
  searchParams
}: {
  searchParams: { search?: string; category?: string }
}) {
  const searchQuery = searchParams.search;
  const categoryParam = searchParams.category;

  // Fetch articles on the server
  const articles = await articlesService.getArticles({ limit: 50 });

  // Filter articles by category and/or search
  let filteredArticles = articles;

  if (categoryParam) {
    filteredArticles = filteredArticles.filter(
      (article) => article.category.categoryName === categoryParam
    );
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredArticles = filteredArticles.filter((article) => {
      const content = article.content?.toLowerCase() ?? "";
      return (
        article.title.toLowerCase().includes(query) ||
        content.includes(query) ||
        article.category.categoryName.toLowerCase().includes(query)
      );
    });
  }

  const error = ""; // Errors can be handled via error.tsx in Next.js

  return (
    <div className="min-h-screen bg-white">
      <LandingClientWrapper>
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
              searchQuery={searchQuery || null}
              categoryName={categoryParam || null}
              resultCount={filteredArticles.length}
            />
          )}

          {/* Two-Column Layout: Latest Stories + Trending Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <LatestStoriesSection
              articles={filteredArticles}
              error={error}
              searchQuery={searchQuery || null}
              isLoading={false}
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
      </LandingClientWrapper>
    </div>
  );
}
