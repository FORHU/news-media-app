import type { Metadata } from "next";
import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
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

  return (
    <div className="bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
        <Suspense fallback={<SearchSkeleton domain={domain} searchQuery={searchQuery} categoryParam={categoryParam} />}>
          <SearchContent 
            domain={domain} 
            searchQuery={searchQuery} 
            categoryParam={categoryParam} 
            tenantId={tenantId} 
          />
        </Suspense>
      </main>
    </div>
  );
}

async function SearchContent({ 
  domain, 
  searchQuery, 
  categoryParam, 
  tenantId 
}: { 
  domain: string; 
  searchQuery?: string; 
  categoryParam?: string; 
  tenantId: string | null;
}) {
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

  const [trendingArticles, sidebarBanners] = await Promise.all([
    tenantId
      ? articlesService.getArticles({ limit: 10, status: "published" }, tenantId)
      : Promise.resolve([]),
    tenantId
      ? bannersService
          .getBanners({ position: "HOME_SIDEBAR", isActive: true, tenantId })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <>
      <FilterStatusBar
        searchQuery={searchQuery || null}
        categoryName={categoryParam ? decodeURIComponent(categoryParam) : null}
        resultCount={articles.length}
        domain={domain}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <LatestStoriesSection
          articles={articles}
          error=""
          searchQuery={searchQuery || null}
          isLoading={false}
          domain={domain}
        />
        <div className="space-y-8">
          <TrendingSidebar 
            articles={trendingArticles} 
            domain={domain}
          />
          <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
        </div>
      </div>
    </>
  );
}

function SearchSkeleton({ domain, searchQuery, categoryParam }: { domain: string, searchQuery?: string, categoryParam?: string }) {
  return (
    <>
      <div className="mb-6 h-16 bg-gray-50 border border-gray-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 w-48 bg-gray-100 rounded mb-6 animate-pulse" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex gap-4 pb-6 border-b border-gray-200 animate-pulse">
              <div className="relative w-28 sm:w-40 h-20 sm:h-28 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-6 w-3/4 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-8">
          <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </>
  );
}

