"use client"; // VoiceJeju Landing Component

import { Suspense } from "react";
import { HeroSection } from "@/components/HeroSection";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { AdBanner } from "@/components/AdBanner";

interface Props {
  tenantId: string | null;
  articles: any[];
  banners: {
    top: any[];
    sidebar: any[];
    footer: any[];
  };
}

export function VoiceJejuLanding({ tenantId, articles, banners }: Props) {
  const error = "";
  
  return (
    <div className="bg-white min-h-screen font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
      </div>

      {articles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HeroSection articles={articles.slice(0, 5)} />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <LatestStoriesSection
            articles={articles}
            error={error}
            searchQuery={null}
            isLoading={false}
            domain="voicejeju.com"
          />
          <div className="space-y-8">
            <TrendingSidebar articles={articles.slice(0, 5)} domain="voicejeju.com" />
            <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
          </div>
        </div>

        <FeaturedArticlesSection
          articles={articles.slice(0, 4)}
        />

        <TrendingProductsSection
          articles={articles
            .filter((a: any) => a.status === "blog")
            .slice(0, 4)}
        />
      </main>
    </div>
  );
}
