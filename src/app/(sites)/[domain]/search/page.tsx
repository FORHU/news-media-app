import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { articlesService } from "@/services/articles.service";
import { resolveTenantIdFromDomain, getSiteNameFromDomain, getSiteIconFromDomain, getSiteLogoFromDomain } from "@/lib/tenant";
import { getRequestBaseUrl, buildOgImageUrl } from "@/lib/metadata";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { TENANT_CATEGORIES } from "@/config/categories";

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

  const isVoiceJeju = domain.toLowerCase().includes("voicejeju");
  const isSkyBluePrime = domain.toLowerCase().includes("skyblueprime");

  const activeCategory = categoryParam ? decodeURIComponent(categoryParam) : null;
  const heroLabel = activeCategory ?? (searchQuery ? `"${searchQuery}"` : "전체 기사");
  const voicejejuCategories = isVoiceJeju ? (TENANT_CATEGORIES["voicejeju.com"] ?? []) : [];

  const sbpLabel = searchQuery
    ? `Search: "${searchQuery}"`
    : categoryParam
    ? decodeURIComponent(categoryParam)
    : "All Stories";

  return (
    <>
      {isVoiceJeju && (
        <div className="bg-black text-white pt-8 pb-10 mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/40 mb-4 text-center">
            {searchQuery ? "Search Results" : "Category"}
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal font-voltaire tracking-tighter leading-[0.9] uppercase text-white text-center mb-4">
            {heroLabel}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 text-center">
            {articles.length} {articles.length === 1 ? "result" : "results"}
          </p>
        </div>
      )}

      {isVoiceJeju && voicejejuCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6 pb-4 border-b border-gray-100">
          {voicejejuCategories.map((cat) => (
            <Link
              key={cat}
              href={`/search?category=${encodeURIComponent(cat)}`}
              className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.3em] border transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black hover:bg-black hover:text-white"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

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

      {/* Top Search Leaderboard Ad (VoiceJeju renders this in layout.tsx instead) */}
      {!isVoiceJeju && (showTopLeaderboard || showMobileLeaderboard) && (
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
      <div className="mb-6 h-10 bg-gray-100 border-b-2 border-gray-200 animate-pulse" />

      {/* Heading Skeleton */}
      <div className="h-6 w-48 bg-gray-100 mb-6 animate-pulse" />

      {/* Latest Stories Skeleton Items */}
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex gap-5 pb-6 border-b border-gray-100 animate-pulse">
          <div className="w-40 sm:w-48 flex-shrink-0 aspect-[4/3] bg-gray-100" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-20 bg-gray-100" />
            <div className="h-6 w-3/4 bg-gray-100" />
            <div className="h-4 w-full bg-gray-100" />
            <div className="h-3 w-32 bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
