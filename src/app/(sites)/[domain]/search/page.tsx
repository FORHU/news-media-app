import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FilterStatusBar } from "@/components/home/filter-status-bar";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { articlesService } from "@/services/articles.service";
import { bannersService } from "@/services/banners.service";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { CategoryFilterSidebar } from "@/components/home/category-filter-sidebar";
import { AdBanner } from "@/components/AdBanner";
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
  const [articles, trendingArticles, sidebarBanners] = await Promise.all([
    tenantId
      ? articlesService.getArticles(
        {
          limit: 100,
          search: searchQuery,
          category: categoryParam,
          status: "published",
        },
        tenantId
      )
      : Promise.resolve([]),
    tenantId
      ? articlesService.getArticles({ limit: 10, status: "published" }, tenantId)
      : Promise.resolve([]),
    tenantId
      ? bannersService
        .getBanners({ position: "HOME_SIDEBAR", isActive: true, tenantId })
        .catch(() => [])
      : Promise.resolve([]),
  ]);

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
  const showSidebarBox = adKeys && adKeys["300x250"] && adKeys["300x250"].length > 0;

  const isVoiceJeju = domain.toLowerCase().includes("voicejeju");
  const isSkyBluePrime = domain.toLowerCase().includes("skyblueprime");
  const isJejuJapan = domain.toLowerCase().includes("jejujapan");

  const activeCategory = categoryParam ? decodeURIComponent(categoryParam) : null;
  const heroLabel = activeCategory ?? (searchQuery ? `"${searchQuery}"` : "전체 기사");
  const voicejejuCategories = isVoiceJeju ? (TENANT_CATEGORIES["voicejeju.com"] ?? []) : [];
  const jejuJapanCategories = isJejuJapan ? (TENANT_CATEGORIES["jejujapan.com"] ?? []) : [];

  const sbpLabel = searchQuery
    ? `Search: "${searchQuery}"`
    : categoryParam
      ? decodeURIComponent(categoryParam)
      : "All Stories";

  if (isJejuJapan) {
    const jejuJapanHeroLabel = activeCategory ?? (searchQuery ? `「${searchQuery}」` : "全記事");
    return (
      <>
        {/* Newspaper-style section header — no full-bleed */}
        <div className="mb-6 pt-2">
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-gray-400 mb-3 uppercase">
            <Link href="/" className="hover:text-[#bc002d] transition-colors">JEJU JAPAN</Link>
            <span className="text-gray-300">›</span>
            <span className="text-[#bc002d]">
              {activeCategory ?? (searchQuery ? "検索結果" : "全記事")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b-[3px] border-[#bc002d] pb-3">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight tracking-tight">
              {jejuJapanHeroLabel}
            </h1>
            <span className="flex-shrink-0 bg-[#bc002d] text-white text-[9px] font-black px-3 py-1.5 tracking-widest">
              {articles.length}件の記事
            </span>
          </div>
        </div>

        {/* Mobile category chip bar */}
        {jejuJapanCategories.length > 0 && (
          <div className="lg:hidden flex gap-2 mb-6 pb-4 border-b border-gray-100 overflow-x-auto scrollbar-hide">
            <Link
              href="/search"
              className={`flex-shrink-0 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                !activeCategory && !searchQuery
                  ? "bg-[#bc002d] text-white border-[#bc002d]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#bc002d] hover:text-[#bc002d]"
              }`}
            >
              全記事
            </Link>
            {jejuJapanCategories.map((cat) => (
              <Link
                key={cat}
                href={activeCategory === cat ? "/search" : `/search?category=${encodeURIComponent(cat)}`}
                className={`flex-shrink-0 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-[#bc002d] text-white border-[#bc002d]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#bc002d] hover:text-[#bc002d]"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 lg:gap-10 mb-12 items-start">
          {/* Main content */}
          <div className="min-w-0">
            <FilterStatusBar
              searchQuery={searchQuery || null}
              categoryName={categoryParam ? decodeURIComponent(categoryParam) : null}
              resultCount={articles.length}
              domain={domain}
            />

            {/* Top ad */}
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
              categoryName={categoryParam ? decodeURIComponent(categoryParam) : null}
              isLoading={false}
              domain={domain}
            />

            {tenantConfig?.native && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <AdsterraNativeBanner domain={domain} />
              </div>
            )}
          </div>

          {/* Sidebar — boxed newspaper column */}
          <aside className="hidden lg:block space-y-0 border border-gray-200 divide-y divide-gray-200 self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            {/* Category index */}
            {jejuJapanCategories.length > 0 && (
              <div>
                <div className="bg-[#bc002d] px-4 py-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">カテゴリー</h3>
                </div>
                <div className="flex flex-col bg-white">
                  <Link
                    href="/search"
                    className={`px-4 py-2.5 text-[11px] font-bold border-b border-gray-100 transition-colors flex items-center justify-between group ${
                      !activeCategory
                        ? "text-[#bc002d] bg-[#bc002d]/5"
                        : "text-gray-700 hover:text-[#bc002d] hover:bg-gray-50"
                    }`}
                  >
                    <span>全記事</span>
                    {!activeCategory && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#bc002d] flex-shrink-0" />
                    )}
                  </Link>
                  {jejuJapanCategories.map((cat) => (
                    <Link
                      key={cat}
                      href={activeCategory === cat ? "/search" : `/search?category=${encodeURIComponent(cat)}`}
                      className={`px-4 py-2.5 text-[11px] font-bold border-b border-gray-100 last:border-0 transition-colors flex items-center justify-between group ${
                        activeCategory === cat
                          ? "text-[#bc002d] bg-[#bc002d]/5"
                          : "text-gray-700 hover:text-[#bc002d] hover:bg-gray-50"
                      }`}
                    >
                      <span>{cat}</span>
                      {activeCategory === cat && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#bc002d] flex-shrink-0" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <TrendingSidebar articles={trendingArticles} domain={domain} />

            {showSidebarBox && adKeys?.["300x250"] && (
              <div className="flex justify-center p-4 bg-white">
                <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} className="!my-0" />
              </div>
            )}
            <div className="bg-white p-4">
              <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
            </div>
          </aside>

          {/* Mobile sidebar — below content */}
          <div className="lg:hidden space-y-8">
            <TrendingSidebar articles={trendingArticles} domain={domain} />
            {showSidebarBox && adKeys?.["300x250"] && (
              <div className="flex justify-center border-b border-gray-100 pb-6">
                <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} className="!my-0" />
              </div>
            )}
            <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
          </div>
        </div>
      </>
    );
  }

  if (isVoiceJeju) {
    return (
      <>
        <div className="bg-black text-white pt-8 pb-10 mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal font-voltaire tracking-tighter leading-[0.9] uppercase text-white text-center mb-4">
            {heroLabel}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white text-center">
            {articles.length} {articles.length === 1 ? "result" : "results"}
          </p>
        </div>

        {/* Mobile-only Category filter chips — top of content (horizontal wrap) */}
        {voicejejuCategories.length > 0 && (
          <div className="lg:hidden flex flex-wrap gap-1.5 mb-6 pb-4 border-b border-gray-100">
            {voicejejuCategories.map((cat) => (
              <Link
                key={cat}
                href={`/search?category=${encodeURIComponent(cat)}`}
                className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.3em] border transition-all whitespace-nowrap ${activeCategory === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black/20 hover:border-black hover:bg-black hover:text-white"
                  }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Main Content Column */}
          <div className="lg:col-span-9">
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

            {/* Bottom Search Native Recommendations */}
            {tenantConfig?.native && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <AdsterraNativeBanner domain={domain} />
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-3 space-y-8">
            {/* Category filter chips — top of sidebar for VoiceJeju (Desktop only) */}
            {voicejejuCategories.length > 0 && (
              <div className="hidden lg:block">
                <Suspense fallback={null}>
                  <CategoryFilterSidebar categories={voicejejuCategories} />
                </Suspense>
              </div>
            )}
            <TrendingSidebar
              articles={trendingArticles}
              domain={domain}
            />
            {showSidebarBox && adKeys?.["300x250"] && (
              <div className="flex justify-center border-b border-gray-100 pb-6">
                <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} className="!my-0" />
              </div>
            )}
            <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
          </aside>
        </div>
      </>
    );
  }

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
