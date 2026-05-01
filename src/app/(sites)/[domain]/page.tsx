import type { Metadata } from "next";
import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { HeroSection } from "@/components/HeroSection";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { AdBanner } from "@/components/AdBanner";
import { articlesService } from "@/services/articles.service";
import { bannersService } from "@/services/banners.service";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO } from "@/config/site";
import { resolveTenantIdFromDomain } from "@/lib/tenant";

// Domain-specific designs
import NewsIconsLanding from "@/components/sites/newsicons/NewsIconsLanding";
import JejuTimeLanding from "@/components/sites/jejutime/JejuTimeLanding";
import JejuQQLanding from "@/components/sites/jejuqq/JejuQQLanding";
import JejuJapanLanding from "@/components/sites/jejujapan/JejuJapanLanding";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  
  let icon = "/icons/newsicons.ico";
  if (domain === "jejutime.com") icon = "/icons/jejutime.ico";
  if (domain === "jejuqq.com") icon = "/icons/jejuqq.ico";
  if (domain === "jejujapan.com") icon = "/icons/jejujapan.ico";

  return {
    title: `Home | ${domain}`,
    description: DEFAULT_SEO.description,
    icons: {
      icon: icon,
    },
    openGraph: {
      title: `Home | ${domain}`,
      description: DEFAULT_SEO.description,
      url: "/",
      type: "website",
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const tenantId = await resolveTenantIdFromDomain(domain);

  const articles = tenantId
    ? await articlesService.getArticles(
        { limit: 50 },
        tenantId
      )
    : [];

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

  const banners = { top: topBanners, sidebar: sidebarBanners, footer: footerBanners };

  // --- Design Routing ---
  if (domain === "newsicons.com") {
      return <NewsIconsLanding tenantId={tenantId} articles={articles} banners={banners} />;
  }

  if (domain === "jejutime.com") {
      return <JejuTimeLanding tenantId={tenantId} articles={articles} banners={banners} />;
  }

  if (domain === "jejuqq.com") {
      return <JejuQQLanding tenantId={tenantId} articles={articles} banners={banners} />;
  }

  if (domain === "jejujapan.com") {
      return <JejuJapanLanding tenantId={tenantId} articles={articles} banners={banners} />;
  }

  // Default design (current layout)
  const error = "";
  return (
    <div className="bg-white">
      <LandingClientWrapper footerBanners={footerBanners}>
        <Suspense fallback={<div className="hidden md:block h-12 bg-black" />}>
          <NavBar />
        </Suspense>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <AdBanner position="HOME_TOP" initialBanners={topBanners} />
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
            />
            <div className="space-y-8">
              <TrendingSidebar articles={articles.slice(0, 5)} />
              <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
            </div>
          </div>

          <FeaturedArticlesSection
            articles={articles.slice(0, 4)}
          />

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


