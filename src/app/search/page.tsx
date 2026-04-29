import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { NavBar } from "@/components/NavBar";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { LandingClientWrapper } from "@/components/home/LandingClientWrapper";
import { AdBanner } from "@/components/AdBanner";
import { articlesService } from "@/services/articles.service";
import { bannersService } from "@/services/banners.service";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO } from "@/config/site";
import { normalizeHostToDomain, resolveTenantIdFromDomain } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Search Results",
  description: "Search results for articles.",
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

export default async function SearchPage(props: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const searchQuery = searchParams.search;
  const categoryParam = searchParams.category;

  // Fetch articles on the server using database-level filtering
  const headerList = await headers();
  const domain = normalizeHostToDomain(headerList.get("host"));
  const tenantId = domain ? await resolveTenantIdFromDomain(domain) : null;

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

  // Fetch banners server-side so AdBanner components skip their client-side fetch.
  // Errors are swallowed — missing banners are non-critical.
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

  const error = ""; // Errors can be handled via error.tsx in Next.js

  return (
    <div className="min-h-screen bg-white">
      <LandingClientWrapper footerBanners={footerBanners}>
        <Suspense fallback={<div className="hidden md:block h-12 bg-black" />}>
          <NavBar />
        </Suspense>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
          {/* Filter Status Bar */}
          <FilterStatusBar
            searchQuery={searchQuery || null}
            categoryName={categoryParam || null}
            resultCount={articles.length}
          />

          {/* Two-Column Layout: Latest Stories + Trending Sidebar */}
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
