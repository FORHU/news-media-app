import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
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
import { bannersService } from "@/services/banners.service";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO } from "@/config/site";
import { normalizeHostToDomain, resolveTenantIdFromDomain } from "@/lib/tenant";

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

export default async function Page() {
  // Fetch articles on the server (latest 50 published)
  const headerList = await headers();
  const domain = normalizeHostToDomain(headerList.get("host"));
  const tenantId = domain ? await resolveTenantIdFromDomain(domain) : null;

  const articles = tenantId
    ? await articlesService.getArticles(
        { limit: 50, status: "published" },
        tenantId
      )
    : [];

  // Fetch banners server-side so AdBanner components skip their client-side fetch.
  // Errors are swallowed — missing banners are non-critical.
  const [topBanners, sidebarBanners, footerBanners] = await Promise.all([
    tenantId
      ? bannersService
          .getBanners({ position: "HOME_TOP", isActive: true, tenantId })
          .catch(() => [])
      : Promise.resolve([]),
    tenantId
      ? bannersService
          .getBanners({ position: "HOME_SIDEBAR", isActive: true, tenantId })
          .catch(() => [])
      : Promise.resolve([]),
    tenantId
      ? bannersService
          .getBanners({ position: "GLOBAL_FOOTER", isActive: true, tenantId })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const error = ""; // Errors can be handled via error.tsx in Next.js

  return (
    <div className="min-h-screen bg-white">
      <LandingClientWrapper footerBanners={footerBanners}>
        <Suspense fallback={<div className="hidden md:block h-12 bg-black" />}>
          <NavBar />
        </Suspense>

        {/* Top Ad Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <AdBanner position="HOME_TOP" initialBanners={topBanners} />
        </div>

        {/* Hero Section - Carousel with trending sidebar & recommendations */}
        {articles.length > 0 && (
          <HeroSection articles={articles.slice(0, 5)} />
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
          {/* Two-Column Layout: Latest Stories + Trending Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <LatestStoriesSection
              articles={articles}
              error={error}
              searchQuery={null}
              isLoading={false}
            />
            <div className="space-y-8">
              <TrendingSidebar articles={articles.slice(0, 5)} />
              <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
            </div>
          </div>

          {/* Featured Articles Grid */}
          <FeaturedArticlesSection
            articles={articles.slice(0, 4)}
          />

          {/* Trending Products Section */}
          <TrendingProductsSection
            articles={articles
              .filter((a) => a.status === "blog")
              .slice(0, 4)}
          />
        </main>
      </LandingClientWrapper>
    </div>
  );
}
