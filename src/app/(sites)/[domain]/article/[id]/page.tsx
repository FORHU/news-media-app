import type { Metadata } from "next";
import { Suspense } from "react";
import { dehydrate } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createQueryClient } from "@/lib/react-query";
import { Hydrate } from "@/components/react-query/Hydrate";
import {
  articlesService,
  ArticlesServiceError,
} from "@/services/articles.service";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO } from "@/config/site";
import ArticlePageClient from "./ArticlePageClient";
import JejuJapanArticle from "@/components/sites/jejujapan/JejuJapanArticle";
import JejuQQArticle from "@/components/sites/jejuqq/JejuQQArticle";
import JejuTimeArticle from "@/components/sites/jejutime/JejuTimeArticle";
import { resolveTenantIdFromDomain, getSiteNameFromDomain } from "@/lib/tenant";
import { prisma } from "@/lib/db";

// Pre-render the top 20 articles per domain at build time (SSG).
// Any articles not pre-rendered will be generated on-demand (ISR).
export const dynamicParams = true;
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  // Only run during production builds — all other environments use ISR.
  if (process.env.NEXT_PHASE !== "phase-production-build") return [];

  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { domain: true, id: true },
    });

    // Fetch all tenant articles in PARALLEL — each gets its own pool connection.
    // This cuts build time from (N tenants × query time) down to max(query time).
    const results = await Promise.all(
      tenants.map(async (tenant) => {
        const articles = await articlesService.getArticles(
          { limit: 20, status: "published" },
          tenant.id
        );
        return articles.flatMap((article) => [
          // Pre-render both slug and ID URLs for instant loads on either format
          ...(article.slug ? [{ domain: tenant.domain, id: article.slug }] : []),
          { domain: tenant.domain, id: article.id },
        ]);
      })
    );

    const staticParams = results.flat();
    console.log(`[generateStaticParams] Pre-rendering ${staticParams.length} article pages across ${tenants.length} domains.`);
    return staticParams;
  } catch (error) {
    // If DB is unreachable during build, fall back to full ISR — build won't fail.
    console.warn("[generateStaticParams] DB unavailable — falling back to ISR:", error);
    return [];
  }
}

import { cleanOgDescription, getRequestBaseUrl, buildOgImageUrl } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; id: string }>;
}): Promise<Metadata> {
  const { domain, id } = await params;
  const articleId = decodeURIComponent(id?.trim() ?? "");
  const tenantId = await resolveTenantIdFromDomain(domain);
  const normalizedDomain = domain.trim().toLowerCase().replace(/^www\./, "");
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.log(
      `[OG] generateMetadata start domain=${domain} normalized=${normalizedDomain} articleId=${articleId} tenantId=${tenantId}`
    );
  }

  if (!articleId || !tenantId) {
    const siteName = getSiteNameFromDomain(domain);
    const baseUrl = await getRequestBaseUrl(domain);

    const logoPath = `/Logo/${
      normalizedDomain === "jejujapan.com"
        ? "JEJUJAPANLOGO.png"
        : normalizedDomain === "jejuqq.com"
          ? "JEJUQQLOGO.png"
          : "JEJUTIMELOGO.png"
    }`;
    const logoUrl = `${baseUrl}${logoPath}`;

    let icon = "/icons/newsicons.ico";
    if (normalizedDomain === "jejutime.com") icon = "/icons/jejutime.ico";
    if (normalizedDomain === "jejuqq.com") icon = "/icons/jejuqq.ico";
    if (normalizedDomain === "jejujapan.com") icon = "/icons/jejujapan.ico";

    const fallbackImage = logoUrl || DEFAULT_OG_IMAGE;
    const { optimized: ogImageOptimized, absolute: ogImageAbsolute } = buildOgImageUrl(
      fallbackImage,
      baseUrl
    );

    const optimizedIsLocal =
      ogImageOptimized.includes(":3000") ||
      ogImageOptimized.includes("localhost") ||
      ogImageOptimized.includes("127.0.0.1");

    const ogImages = optimizedIsLocal
      ? [{ url: ogImageAbsolute, width: 1200, height: 630, alt: siteName }]
      : [
          { url: ogImageAbsolute, width: 1200, height: 630, alt: siteName },
          { url: ogImageOptimized, width: 1200, height: 630, alt: siteName },
        ];

    if (isDev) {
      console.log(
        `[OG] selected images domain=${normalizedDomain} optimizedIsLocal=${optimizedIsLocal} imagesCount=${ogImages.length} first=${ogImages[0]?.url}`
      );
    }

    const articleUrl = articleId
      ? `${baseUrl}/article/${encodeURIComponent(articleId)}`
      : baseUrl;

    if (isDev) {
      console.log(
        `[OG] fallback(missing tenant/article) domain=${normalizedDomain} og:image abs=${ogImageAbsolute} og:image opt=${ogImageOptimized}`
      );
    }

    return {
      metadataBase: new URL(baseUrl),
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
      icons: { icon },
      alternates: { canonical: articleUrl },
      openGraph: {
        title: DEFAULT_SEO.title,
        description: DEFAULT_SEO.description,
        url: articleUrl,
        type: "article",
        siteName,
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: DEFAULT_SEO.title,
        description: DEFAULT_SEO.description,
        images: ogImages.map((i) => i.url),
      },
    };
  }

  try {
    const article = await articlesService.getArticleBySlugOrId(articleId, tenantId);
    const title = article.title ?? DEFAULT_SEO.title;
    const description = cleanOgDescription(article.content ?? DEFAULT_SEO.description, 160);
    const siteName = getSiteNameFromDomain(domain);
    const baseUrl = await getRequestBaseUrl(domain);
    const logoPath = `/Logo/${
      normalizedDomain === "jejujapan.com"
        ? "JEJUJAPANLOGO.png"
        : normalizedDomain === "jejuqq.com"
          ? "JEJUQQLOGO.png"
          : "JEJUTIMELOGO.png"
    }`;
    const logoUrl = `${baseUrl}${logoPath}`;
    const canonicalSlug = article.slug ?? article.id;
    const articlePath = `/article/${canonicalSlug}`;
    const articleUrl = `${baseUrl}${articlePath}`;

    // Prefer the DB-provided Supabase image URL for OG:image.
    const dbImageUrl = (article as any).imageUrl as string | undefined | null;
    const rawOgImage = dbImageUrl?.trim() ? dbImageUrl.trim() : logoUrl || DEFAULT_OG_IMAGE;
    const { optimized: ogImageOptimized, absolute: ogImageAbsolute } = buildOgImageUrl(
      rawOgImage,
      baseUrl
    );
    const usedDbImage = Boolean(dbImageUrl?.trim());

    let icon = "/icons/newsicons.ico";
    if (normalizedDomain === "jejutime.com") icon = "/icons/jejutime.ico";
    if (normalizedDomain === "jejuqq.com") icon = "/icons/jejuqq.ico";
    if (normalizedDomain === "jejujapan.com") icon = "/icons/jejujapan.ico";

    if (isDev) {
      const hasAbs = Boolean(ogImageAbsolute);
      const hasOpt = Boolean(ogImageOptimized);
      console.log(
        `[OG] success domain=${normalizedDomain} tenantId=${tenantId} usedDbImage=${usedDbImage} hasOgImage=${hasAbs && hasOpt} og:image abs=${ogImageAbsolute} og:image opt=${ogImageOptimized}`
      );
    }

    const optimizedIsLocal =
      ogImageOptimized.includes(":3000") ||
      ogImageOptimized.includes("localhost") ||
      ogImageOptimized.includes("127.0.0.1");

    const ogImages = optimizedIsLocal
      ? [
          {
            url: ogImageAbsolute,
            width: 1200,
            height: 630,
            alt: siteName,
          },
        ]
      : [
          {
            url: ogImageAbsolute, // Absolute URL is always publicly reachable (Supabase/public storage)
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
        ];

    if (isDev) {
      console.log(
        `[OG] selected images domain=${normalizedDomain} optimizedIsLocal=${optimizedIsLocal} imagesCount=${ogImages.length} first=${ogImages[0]?.url}`
      );
    }

    return {
      metadataBase: new URL(baseUrl),
      title,
      description,
      icons: {
        icon: icon,
      },
      alternates: {
        canonical: articleUrl,
      },
      openGraph: {
        title,
        description,
        url: articleUrl,
        type: "article",
        siteName,
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ogImages.map((i) => i.url),
      },
    };
  } catch (error) {
    const siteName = getSiteNameFromDomain(domain);
    const baseUrl = await getRequestBaseUrl(domain);

    const logoPath = `/Logo/${
      normalizedDomain === "jejujapan.com"
        ? "JEJUJAPANLOGO.png"
        : normalizedDomain === "jejuqq.com"
          ? "JEJUQQLOGO.png"
          : "JEJUTIMELOGO.png"
    }`;
    const logoUrl = `${baseUrl}${logoPath}`;
    const fallbackImage = logoUrl || DEFAULT_OG_IMAGE;
    const { optimized: ogImageOptimized, absolute: ogImageAbsolute } = buildOgImageUrl(
      fallbackImage,
      baseUrl
    );

    let icon = "/icons/newsicons.ico";
    if (normalizedDomain === "jejutime.com") icon = "/icons/jejutime.ico";
    if (normalizedDomain === "jejuqq.com") icon = "/icons/jejuqq.ico";
    if (normalizedDomain === "jejujapan.com") icon = "/icons/jejujapan.ico";

    const articleUrl = `${baseUrl}/article/${encodeURIComponent(articleId)}`;

    if (isDev) {
      const hasAbs = Boolean(ogImageAbsolute);
      const hasOpt = Boolean(ogImageOptimized);
      console.warn(
        `[OG] error path domain=${normalizedDomain} tenantId=${tenantId} error=${String(
          error
        )} hasOgImage=${hasAbs && hasOpt} og:image abs=${ogImageAbsolute} og:image opt=${ogImageOptimized}`
      );
    }

    const optimizedIsLocal =
      ogImageOptimized.includes(":3000") ||
      ogImageOptimized.includes("localhost") ||
      ogImageOptimized.includes("127.0.0.1");

    const ogImages = optimizedIsLocal
      ? [{ url: ogImageAbsolute, width: 1200, height: 630, alt: siteName }]
      : [
          { url: ogImageAbsolute, width: 1200, height: 630, alt: siteName },
          { url: ogImageOptimized, width: 1200, height: 630, alt: siteName },
        ];

    return {
      metadataBase: new URL(baseUrl),
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
      icons: { icon },
      alternates: { canonical: articleUrl },
      openGraph: {
        title: DEFAULT_SEO.title,
        description: DEFAULT_SEO.description,
        url: articleUrl,
        type: "article",
        siteName,
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: DEFAULT_SEO.title,
        description: DEFAULT_SEO.description,
        images: ogImages.map((i) => i.url),
      },
    };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ domain: string; id: string }>;
}) {
  const { domain, id } = await params;
  const articleId = decodeURIComponent(id?.trim() ?? "");

  if (!articleId) {
    notFound();
  }

  const tenantId = await resolveTenantIdFromDomain(domain);

  if (!tenantId) {
    notFound();
  }

  const queryClient = createQueryClient();

  // Fetch article — separated from redirect() so Next.js's internal redirect
  // error is never accidentally swallowed by this catch block.
  let canonicalSlug: string;
  try {
    const article = await articlesService.getArticleBySlugOrId(articleId, tenantId);
    canonicalSlug = article.slug ?? article.id;
    queryClient.setQueryData(["article", canonicalSlug], article);
  } catch (error: any) {
    // Avoid using `instanceof` for custom errors in Server Components,
    // as bundler boundaries can sometimes break the prototype chain.
    if (error && typeof error === "object" && error.status === 404) {
      notFound();
    }
    // Re-throw any other unexpected errors (e.g. DB connection issues)
    // so they surface as proper 500 pages rather than silent failures.
    console.error("ArticlePage unhandled error:", error);
    throw error;
  }

  // redirect() throws a special Next.js internal error — it MUST be called
  // outside of any try-catch block so it is never accidentally swallowed.
  if (articleId !== canonicalSlug) {
    redirect(encodeURI(`/article/${canonicalSlug}`));
  }

  // Fetch only what's needed for the sidebar — fewer articles = smaller ISR page HTML.
  // The full article list is available via client-side fetching if needed.
  const allArticles = await articlesService.getArticleSummaries({
    limit: 10,
    status: "published",
  }, tenantId).catch(() => [] as Awaited<ReturnType<typeof articlesService.getArticleSummaries>>);

  const dehydratedState = dehydrate(queryClient);

  return (
    <Hydrate state={dehydratedState}>
      <Suspense fallback={<div className="min-h-[60vh] bg-white" />}>
        {domain === "jejujapan.com" ? (
          <JejuJapanArticle articleId={canonicalSlug} initialOtherArticles={allArticles} />
        ) : domain === "jejuqq.com" ? (
          <JejuQQArticle articleId={canonicalSlug} initialOtherArticles={allArticles} />
        ) : domain === "jejutime.com" ? (
          <JejuTimeArticle articleId={canonicalSlug} initialOtherArticles={allArticles} />
        ) : (
          <ArticlePageClient articleId={canonicalSlug} initialOtherArticles={allArticles} domain={domain} />
        )}
      </Suspense>
    </Hydrate>
  );
}

