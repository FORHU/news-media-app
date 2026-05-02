import { AdBanner } from "@/components/AdBanner";
import { HeroSection } from "@/components/HeroSection";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import dynamic from "next/dynamic";

const TrendingProductsSection = dynamic(() => import("@/components/home/trending-products-section").then(m => m.TrendingProductsSection), { ssr: true });

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
    <div className="bg-slate-50">
      {/* Top Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* Hero Carousel */}
        {articles.length > 0 && (
          <div className="mb-10">
            <HeroSection articles={articles.slice(0, 5)} />
          </div>
        )}

        {/* Latest Stories + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <LatestStoriesSection
              articles={articles}
              error=""
              searchQuery={null}
              isLoading={false}
              domain="newsicons.com"
            />
          </div>

          <div className="space-y-8">
            <TrendingSidebar articles={articles.slice(0, 5)} domain="newsicons.com" />
            <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
          </div>
        </div>

        {/* Featured Articles */}
        <FeaturedArticlesSection articles={articles.slice(0, 4)} domain="newsicons.com" />

        {/* Trending / Blog Posts */}
        <TrendingProductsSection
          articles={articles.filter((a: any) => a.status === "blog").slice(0, 4)}
        />

      </main>
    </div>
  );
}
