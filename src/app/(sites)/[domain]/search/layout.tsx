import { resolveTenantIdFromDomain } from "@/lib/tenant";
import { articlesService } from "@/services/articles.service";
import { bannersService } from "@/services/banners.service";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { AdBanner } from "@/components/AdBanner";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";

export default async function SearchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const tenantId = await resolveTenantIdFromDomain(domain);

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
  // Standard 160x600 skyscrapers
  const showSkyscrapers = adKeys && adKeys["160x600"] && adKeys["160x600"].length > 0;
  // skyblueprime uses 160x300 half-page gutters
  const showHalfPageGutters = !showSkyscrapers && adKeys && adKeys["160x300"] && adKeys["160x300"].length > 0;
  const showSidebarBox = adKeys && adKeys["300x250"] && adKeys["300x250"].length > 0;

  const isVoiceJeju = domain.toLowerCase().includes("voicejeju");
  const isJejuJapan = domain.toLowerCase().includes("jejujapan");
  const isSkyBluePrime = domain.toLowerCase().includes("skyblueprime");

  // Trending stories are "constant" for the search session, so we fetch them here
  // (We skip fetching in layout if VoiceJeju or JejuJapan, since those render their sidebar inside page.tsx)
  const [trendingArticles, sidebarBanners] = (isVoiceJeju || isJejuJapan)
    ? [[], []]
    : await Promise.all([
        tenantId
          ? articlesService.getArticles({ limit: 10, status: "published" }, tenantId)
          : Promise.resolve([]),
        tenantId
          ? bannersService
              .getBanners({ position: "HOME_SIDEBAR", isActive: true, tenantId })
              .catch(() => [])
          : Promise.resolve([]),
      ]);

  const desktopLeaderboardKey = adKeys?.["728x90"] || adKeys?.["468x60"];
  const desktopLeaderboardWidth = adKeys?.["728x90"] ? 728 : 468;
  const desktopLeaderboardHeight = adKeys?.["728x90"] ? 90 : 60;
  const showDesktopLeaderboard = !!desktopLeaderboardKey;
  const showMobileLeaderboard = !!(adKeys?.["320x50"] && adKeys["320x50"].length > 0);

  if (isJejuJapan) {
    return (
      <div className="bg-white">
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
          {showSkyscrapers && adKeys?.["160x600"] && (
            <div className="hidden min-[1650px]:block absolute right-full mr-6 top-32 bottom-32 w-[160px] z-30">
              <div className="sticky top-40">
                <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
              </div>
            </div>
          )}
          {showSkyscrapers && adKeys?.["160x600"] && (
            <div className="hidden min-[1650px]:block absolute left-full ml-6 top-32 bottom-32 w-[160px] z-30">
              <div className="sticky top-40">
                <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    );
  }

  if (isVoiceJeju) {
    return (
      <div className="bg-white">
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
          {/* Floating Left Gutter Skyscraper (160x600) */}
          {showSkyscrapers && adKeys?.["160x600"] && (
            <div className="hidden min-[1650px]:block absolute right-full mr-6 top-32 bottom-32 w-[160px] z-30">
              <div className="sticky top-40">
                <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
              </div>
            </div>
          )}

          {/* Floating Right Gutter Skyscraper (160x600) */}
          {showSkyscrapers && adKeys?.["160x600"] && (
            <div className="hidden min-[1650px]:block absolute left-full ml-6 top-32 bottom-32 w-[160px] z-30">
              <div className="sticky top-40">
                <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
              </div>
            </div>
          )}

          {/* VoiceJeju Leaderboard — below site header, above page content */}
          {(showDesktopLeaderboard || showMobileLeaderboard) && (
            <div className="w-full flex justify-center py-3 border-b border-gray-100 mb-0 overflow-hidden">
              {showDesktopLeaderboard && desktopLeaderboardKey && (
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

          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={isSkyBluePrime ? "bg-white min-h-screen" : "bg-white"}>
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
        {/* Floating Left Gutter Skyscraper (160x600) */}
        {showSkyscrapers && adKeys?.["160x600"] && (
          <div className="hidden min-[1650px]:block absolute right-full mr-6 top-32 bottom-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        )}

        {/* Floating Right Gutter Skyscraper (160x600) */}
        {showSkyscrapers && adKeys?.["160x600"] && (
          <div className="hidden min-[1650px]:block absolute left-full ml-6 top-32 bottom-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
            </div>
          </div>
        )}

        {/* Floating Left Gutter Half-Page (160x300) for skyblueprime */}
        {showHalfPageGutters && adKeys?.["160x300"] && (
          <div className="hidden min-[1650px]:block absolute right-full mr-5 top-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x300"]} width={160} height={300} className="!my-0" />
            </div>
          </div>
        )}

        {/* Floating Right Gutter Half-Page (160x300) for skyblueprime */}
        {showHalfPageGutters && adKeys?.["160x300"] && (
          <div className="hidden min-[1650px]:block absolute left-full ml-5 top-32 w-[160px] z-30">
            <div className="sticky top-40">
              <AdsterraBanner bannerKey={adKeys["160x300"]} width={160} height={300} className="!my-0" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Main Content (Latest Stories Results) */}
          <div className="lg:col-span-9">
            {children}
          </div>

          {/* Sidebar (Stays loaded during result navigation) */}
          <aside className="lg:col-span-3 space-y-8">
            <TrendingSidebar 
              articles={trendingArticles} 
              domain={domain}
            />
            {showSidebarBox && (
              <div className="flex justify-center border-b border-gray-100 pb-6">
                <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} className="!my-0" />
              </div>
            )}
            <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
          </aside>
        </div>
      </main>
    </div>
  );
}
