import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { HeroSection } from "@/components/HeroSection";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
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

export default function NewsIconsLanding({ tenantId, articles, banners }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <LandingClientWrapper footerBanners={banners.footer}>
        <Suspense fallback={<div className="h-16 bg-blue-900" />}>
          <NavBar />
        </Suspense>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <AdBanner position="HOME_TOP" initialBanners={banners.top} />
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          {/* Big Hero Slider for NewsIcons */}
          {articles.length > 0 && (
            <div className="mb-10">
              <HeroSection articles={articles.slice(0, 5)} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <LatestStoriesSection
                articles={articles}
                error=""
                searchQuery={null}
                isLoading={false}
              />
            </div>
            
            <div className="space-y-8">
              <TrendingSidebar articles={articles.slice(0, 5)} />
              <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
            </div>
          </div>

          <FeaturedArticlesSection articles={articles.slice(0, 4)} />

          <TrendingProductsSection
            articles={articles.filter((a: any) => a.status === "blog").slice(0, 4)}
          />
        </main>
      </LandingClientWrapper>
    </div>
  );
}
