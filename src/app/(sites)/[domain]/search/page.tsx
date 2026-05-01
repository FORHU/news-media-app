import type { Metadata } from "next";
import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { AdBanner } from "@/components/AdBanner";
import { articlesService } from "@/services/articles.service";
import { bannersService } from "@/services/banners.service";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO } from "@/config/site";
import { resolveTenantIdFromDomain } from "@/lib/tenant";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  
  let icon = "/icons/newsicons.ico";
  if (domain === "jejutime.com") icon = "/icons/jejutime.ico";
  if (domain === "jejuqq.com") icon = "/icons/jejuqq.ico";
  if (domain === "jejujapan.com") icon = "/icons/jejujapan.ico";

  return {
    title: "Search Results",
    description: "Search results for articles.",
    icons: {
      icon: icon,
    },
    openGraph: {
      title: "Search Results",
      description: "Search results for articles.",
      url: "/search",
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
      title: "Search Results",
      description: "Search results for articles.",
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: "/search",
    },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { domain } = await params;
  const { search: searchQuery, category: categoryParam } = await searchParams;

  const tenantId = await resolveTenantIdFromDomain(domain);

  const articles = tenantId
    ? await articlesService.getArticles(
        {
          limit: 50,
          search: searchQuery,
          category: categoryParam,
          status: "published",
        },
        tenantId
      )
    : [];

  const [sidebarBanners, footerBanners] = await Promise.all([
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

  const error = "";

  return (
    <div className="bg-white">
      <LandingClientWrapper footerBanners={footerBanners}>
        {domain !== "jejutime.com" && domain !== "jejuqq.com" && domain !== "jejujapan.com" && (
          <Suspense fallback={<div className="hidden md:block h-12 bg-black" />}>
            <NavBar />
          </Suspense>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
          <FilterStatusBar
            searchQuery={searchQuery || null}
            categoryName={categoryParam || null}
            resultCount={articles.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <LatestStoriesSection
              articles={articles}
              error={error}
              searchQuery={searchQuery || null}
              isLoading={false}
            />
            <div className="space-y-8">
              <TrendingSidebar articles={articles.slice(0, 5)} />
              <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
            </div>
          </div>
        </main>
      </LandingClientWrapper>
    </div>
  );
}

