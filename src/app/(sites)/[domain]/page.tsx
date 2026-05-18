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

// Domain-specific designs
import NewsIconsLanding from "@/components/sites/newsicons/NewsIconsLanding";
import JejuTimeLanding from "@/components/sites/jejutime/JejuTimeLanding";
import JejuQQLanding from "@/components/sites/jejuqq/JejuQQLanding";
import JejuJapanLanding from "@/components/sites/jejujapan/JejuJapanLanding";
import { VoiceJejuLanding } from "@/components/sites/voicejeju/VoiceJejuLanding";
import SkyBluePrimeLanding from "@/components/sites/skyblueprime/SkyBluePrimeLanding";

export const revalidate = 300;

export async function generateStaticParams() {
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

  const articles = tenantId
    ? await articlesService.getArticles(
      { limit: 100, status: "published" },
      tenantId
    )
    : [];

  const [
    topBanners,
    sidebarBanners,
    footerBanners,
    sideLTopBanners,
    sideLMidBanners,
    sideRMidBanners,
    sideRBtmBanners,
    contentMidBanners,
  ] = await Promise.all([
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
    tenantId
      ? bannersService
        .getBanners({ position: "SIDEBAR_L_TOP", isActive: true, tenantId })
        .catch(() => [])
      : Promise.resolve([]),
    tenantId
      ? bannersService
        .getBanners({ position: "SIDEBAR_L_MID", isActive: true, tenantId })
        .catch(() => [])
      : Promise.resolve([]),
    tenantId
      ? bannersService
        .getBanners({ position: "SIDEBAR_R_MID", isActive: true, tenantId })
        .catch(() => [])
      : Promise.resolve([]),
    tenantId
      ? bannersService
        .getBanners({ position: "SIDEBAR_R_BTM", isActive: true, tenantId })
        .catch(() => [])
      : Promise.resolve([]),
    tenantId
      ? bannersService
        .getBanners({ position: "CONTENT_MID", isActive: true, tenantId })
        .catch(() => [])
      : Promise.resolve([]),
  ]);

  const banners = {
    top: topBanners,
    sidebar: sidebarBanners,
    footer: footerBanners,
    sideLTop: sideLTopBanners,
    sideLMid: sideLMidBanners,
    sideRMid: sideRMidBanners,
    sideRBtm: sideRBtmBanners,
    contentMid: contentMidBanners,
  };

  // --- Design Routing ---
  if (domain === "newsicons.com") {
    return <NewsIconsLanding tenantId={tenantId} articles={articles} banners={banners as any} />;
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
    return <SkyBluePrimeLanding tenantId={tenantId} articles={articles} banners={banners as any} />;
  }

  // Default design (current layout)
  const error = "";
  return (
    <div className="bg-white">
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
            domain={domain}
          />
          <div className="space-y-8">
            <TrendingSidebar articles={articles.slice(0, 5)} domain={domain} />
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
    </div>
  );
}


