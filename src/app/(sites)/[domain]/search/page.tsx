import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { articlesService } from "@/services/articles.service";
import { resolveTenantIdFromDomain, getSiteNameFromDomain, getSiteIconFromDomain, getSiteLogoFromDomain } from "@/lib/tenant";
import { getRequestBaseUrl, buildOgImageUrl } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const siteName = getSiteNameFromDomain(domain);
  const baseUrl = await getRequestBaseUrl(domain);
  const logoPath = `/Logo/${getSiteLogoFromDomain(domain)}`;
  const logoUrl = `${baseUrl}${logoPath}`;
  const { absolute: ogImageAbsolute } = buildOgImageUrl(logoUrl, baseUrl);

  return {
    title: "Search",
    description: `Search results for ${siteName}`,
    icons: {
      icon: getSiteIconFromDomain(domain),
    },
    openGraph: {
      title: "Search",
      description: `Search results for ${siteName}`,
      url: "/search",
      type: "website",
      siteName: siteName,
      images: [
        {
          url: ogImageAbsolute,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Search",
      description: `Search results for ${siteName}`,
      images: [ogImageAbsolute],
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

  // We use a key on Suspense to force it to show the fallback during searchParams changes
  const suspenseKey = `${searchQuery || ""}-${categoryParam || ""}`;

  return (
    <Suspense 
      key={suspenseKey} 
      fallback={<LatestStoriesSkeleton />}
    >
      <SearchContent 
        domain={domain} 
        searchQuery={searchQuery} 
        categoryParam={categoryParam} 
        tenantId={tenantId} 
      />
    </Suspense>
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

  return (
    <>
      <FilterStatusBar
        searchQuery={searchQuery || null}
        categoryName={categoryParam ? decodeURIComponent(categoryParam) : null}
        resultCount={articles.length}
        domain={domain}
      />

      <LatestStoriesSection
        articles={articles}
        error=""
        searchQuery={searchQuery || null}
        isLoading={false}
        domain={domain}
      />
    </>
  );
}

function LatestStoriesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton for FilterStatusBar */}
      <div className="mb-6 h-16 bg-gray-50 border border-gray-200 rounded-lg animate-pulse" />
      
      {/* Heading Skeleton */}
      <div className="h-8 w-48 bg-gray-100 rounded mb-6 animate-pulse" />
      
      {/* Latest Stories Skeleton Items */}
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
  );
}
