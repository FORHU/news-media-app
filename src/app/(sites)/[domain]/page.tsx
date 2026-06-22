import type { Metadata } from "next";
import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { HeroSection } from "@/components/HeroSection";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { TrendingProductsSection } from "@/components/home/trending-products-section";
import { AdBanner } from "@/components/AdBanner";
import { articlesService } from "@/services/articles.service";
import { bannersService } from "@/services/banners.service";
import { resolveTenantIdFromDomain, getSiteNameFromDomain, getSiteIconFromDomain, getSiteLogoFromDomain, getSiteDescriptionFromDomain } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { fetchRssFeed } from "@/lib/rss";
import { fetchMediaStackNews } from "@/lib/mediastack";

// Domain-specific designs
import NewsIconsLanding from "@/components/sites/newsicons/NewsIconsLanding";
import JejuTimeLanding from "@/components/sites/jejutime/JejuTimeLanding";
import JejuQQLanding from "@/components/sites/jejuqq/JejuQQLanding";
import JejuJapanLanding from "@/components/sites/jejujapan/JejuJapanLanding";
import { VoiceJejuLanding } from "@/components/sites/voicejeju/VoiceJejuLanding";
import SkyBluePrimeLanding from "@/components/sites/skyblueprime/SkyBluePrimeLanding";
import LavagueTechLanding from "@/components/sites/lavaguetech/LavagueTechLanding";

export const revalidate = 300;

export async function generateStaticParams() {
  if (process.env.NODE_ENV === "development") return [];
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { domain: true },
    });
    return tenants.map((t) => ({ domain: t.domain }));
  } catch (error) {
    console.error("Error generating static params for domains:", error);
    return [];
  }
}

import { getRequestBaseUrl, buildOgImageUrl } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;

  const icon = getSiteIconFromDomain(domain);
  const siteName = getSiteNameFromDomain(domain);
  const baseUrl = await getRequestBaseUrl(domain);
  const logoPath = `/Logo/${getSiteLogoFromDomain(domain)}`;
  const logoUrl = `${baseUrl}${logoPath}`;
  const { optimized: ogImageOptimized, absolute: ogImageAbsolute } = buildOgImageUrl(
    logoUrl,
    baseUrl
  );

  console.log(`[Page Metadata] Generating for ${domain}:`, {
    siteName,
    baseUrl,
    logoUrl
  });

  return {
    metadataBase: new URL(baseUrl),
    title: {
      absolute: `${siteName} | ${getSiteDescriptionFromDomain(domain)}`,
    },
    description: getSiteDescriptionFromDomain(domain),
    icons: {
      icon: icon,
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: siteName,
      description: getSiteDescriptionFromDomain(domain),
      url: baseUrl,
      type: "website",
      images: [
        {
          url: ogImageAbsolute, // Absolute PNG first for Messenger
          width: 1200,
          height: 630,
          alt: siteName,
        },
        {
          url: ogImageOptimized,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: getSiteDescriptionFromDomain(domain),
      images: [ogImageAbsolute, ogImageOptimized],
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

  const emptyBanners = { top: [], sidebar: [], footer: [], sideLTop: [], sideLMid: [], sideRMid: [], sideRBtm: [], contentMid: [] };

  const [articles, banners] = await Promise.all([
    tenantId
      ? articlesService.getArticles({ limit: 60, status: "published" }, tenantId)
      : Promise.resolve([]),
    tenantId
      ? bannersService.getAllBannersForTenant(tenantId).catch(() => emptyBanners)
      : Promise.resolve(emptyBanners),
  ]);

  // --- Design Routing ---
  if (domain === "newsicons.com") {
    const mediastackArticles = await fetchMediaStackNews({
      categories: "technology",
      languages: "en",
      limit: 100,
    });
    return <NewsIconsLanding tenantId={tenantId} articles={articles} banners={banners as any} mediastackArticles={mediastackArticles} />;
  }

  if (domain === "jejutime.com") {
    return <JejuTimeLanding tenantId={tenantId} articles={articles} banners={banners as any} />;
  }

  if (domain === "jejuqq.com") {
    return <JejuQQLanding tenantId={tenantId} articles={articles} banners={banners as any} />;
  }

  if (domain === "jejujapan.com") {
    return <JejuJapanLanding tenantId={tenantId} articles={articles} banners={banners as any} />;
  }

  if (domain === "voicejeju.com") {
    return <VoiceJejuLanding tenantId={tenantId} articles={articles} banners={banners as any} />;
  }

  if (domain === "skyblueprime.com") {
    const sbpMediastack = await fetchMediaStackNews({ categories: "technology", languages: "en", limit: 100 });
    return <SkyBluePrimeLanding tenantId={tenantId} articles={articles} banners={banners as any} mediastackArticles={sbpMediastack} />;
  }

  if (domain === "lavaguetech.com") {
    const [ltRssFeeds, ltMediastack] = await Promise.all([
      Promise.all([
        fetchRssFeed("https://www.frandroid.com/feed", "Frandroid", 12),
        fetchRssFeed("https://www.01net.com/feed/", "01net", 12),
        fetchRssFeed("https://www.numerama.com/feed/", "Numerama", 12),
        fetchRssFeed("https://www.phonandroid.com/feed", "PhonAndroid", 12),
        fetchRssFeed("https://www.clubic.com/feed/rss/", "Clubic", 10),
      ]),
      fetchMediaStackNews({ categories: "technology", limit: 50 }),
    ]);
    const ltRssArticles = ltRssFeeds
      .flat()
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return (
      <LavagueTechLanding
        tenantId={tenantId}
        articles={articles}
        banners={banners as any}
        rssArticles={ltRssArticles}
        mediastackArticles={ltMediastack}
      />
    );
  }

  // Default design (current layout)
  const error = "";
  return (
    <div className="bg-white">
      <Suspense fallback={<div className="hidden md:block h-12 bg-black" />}>
        <NavBar />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
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
            domain={domain}
          />
          <div className="space-y-8">
            <TrendingSidebar articles={articles.slice(0, 5)} domain={domain} />
            <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
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
    </div>
  );
}


