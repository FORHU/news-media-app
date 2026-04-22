import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { HeroSection } from "@/components/HeroSection";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { AdBanner } from "@/components/AdBanner";
import { articlesService } from "@/services/articles.service";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO } from "@/config/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Home",
  description: DEFAULT_SEO.description,
  openGraph: {
    title: "Home",
    description: DEFAULT_SEO.description,
    url: "/",
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: DEFAULT_SEO.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home",
    description: DEFAULT_SEO.description,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function Page(props: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const searchQuery = searchParams.search;
  const categoryParam = searchParams.category;

  // Fetch articles on the server using database-level filtering
  const articles = await articlesService.getArticles({ 
    limit: 50,
    search: searchQuery,
    category: categoryParam,
    status: "published"
  });

  const filteredArticles = articles;

  const error = ""; // Errors can be handled via error.tsx in Next.js

  return (
    <div className="min-h-screen bg-white">
      <LandingClientWrapper>
        <NavBar />

        {/* Top Ad Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <AdBanner position="HOME_TOP" />
        </div>

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
            <div className="space-y-8">
              <TrendingSidebar articles={filteredArticles.slice(0, 5)} />
              <AdBanner position="HOME_SIDEBAR" />
            </div>
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
