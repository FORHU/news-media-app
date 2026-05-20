import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { articlesService } from "@/services/articles.service";
import { resolveTenantIdFromDomain, getSiteNameFromDomain, getSiteIconFromDomain, getSiteLogoFromDomain } from "@/lib/tenant";
import { getRequestBaseUrl, buildOgImageUrl } from "@/lib/metadata";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";

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

  // Dynamic Tenant Resolution for Adsterra Config
  const tenantKey = domain.toLowerCase().includes("voicejeju")
    ? "voicejeju"
    : domain.toLowerCase().includes("jejutime")
      ? "jejutime"
      : domain.toLowerCase().includes("jejujapan")
        ? "jejujapan"
        : domain.toLowerCase().includes("jejuqq")
          ? "jejuqq"
          : domain.toLowerCase().includes("skyblueprime")
            ? "skyblueprime"
            : "default";

  const tenantConfig = ADSTERRA_CONFIG[tenantKey];
  const adKeys = tenantConfig?.banners;
  // skyblueprime uses 468x60 instead of 728x90
  const desktopLeaderboardKey = adKeys?.["728x90"] || adKeys?.["468x60"];
  const desktopLeaderboardWidth = adKeys?.["728x90"] ? 728 : 468;
  const desktopLeaderboardHeight = adKeys?.["728x90"] ? 90 : 60;
  const showTopLeaderboard = !!desktopLeaderboardKey;
  const showMobileLeaderboard = !!(adKeys && adKeys["320x50"] && adKeys["320x50"].length > 0);

  const isSkyBluePrime = domain.toLowerCase().includes("skyblueprime");
  const sbpLabel = searchQuery
    ? `Search: "${searchQuery}"`
    : categoryParam
    ? decodeURIComponent(categoryParam)
    : "All Stories";

  return (
    <>
      {isSkyBluePrime && (
        <div className="border-t-[6px] border-sky-950 pt-3 mb-6">
          <h1 className="text-[11px] font-black uppercase tracking-widest text-white bg-sky-950 inline-block px-3 py-1.5 leading-none">
            {sbpLabel}
          </h1>
        </div>
      )}

      <FilterStatusBar
        searchQuery={searchQuery || null}
        categoryName={categoryParam ? decodeURIComponent(categoryParam) : null}
        resultCount={articles.length}
        domain={domain}
      />

      {/* Top Search Leaderboard Ad */}
      {(showTopLeaderboard || showMobileLeaderboard) && (
        <div className="w-full flex justify-center py-4 border-b border-gray-100 mb-6 overflow-hidden">
          {showTopLeaderboard && desktopLeaderboardKey && (
            <div className="hidden sm:block">
              <AdsterraBanner bannerKey={desktopLeaderboardKey} width={desktopLeaderboardWidth} height={desktopLeaderboardHeight} className="!my-0" />
            </div>
          )}
          {showMobileLeaderboard && adKeys?.["320x50"] && (
            <div className="block sm:hidden">
              <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} className="!my-0" />
            </div>
          )}
        </div>
      )}

      <LatestStoriesSection
        articles={articles}
        error=""
        searchQuery={searchQuery || null}
        isLoading={false}
        domain={domain}
      />

      {/* Bottom Search Native Recommendations */}
      {tenantConfig?.native && (
        <div className="mt-12 pt-8 border-t border-gray-100">
          <AdsterraNativeBanner domain={domain} />
        </div>
      )}
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
