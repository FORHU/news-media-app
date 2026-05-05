import type { Metadata } from "next";
import { Suspense } from "react";
import { dehydrate } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
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
import { resolveTenantIdFromDomain } from "@/lib/tenant";

// Force dynamic rendering — article pages query the DB (Prisma) at request time.
// Static/ISR pre-rendering triggers DYNAMIC_SERVER_USAGE on Vercel.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; id: string }>;
}): Promise<Metadata> {
  const { domain, id } = await params;
  const articleId = decodeURIComponent(id?.trim() ?? "");
  const tenantId = await resolveTenantIdFromDomain(domain);

  if (!articleId || !tenantId) {
    return {
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
    };
  }

  try {
    const article = await articlesService.getArticleBySlugOrId(articleId, tenantId);
    const title = article.title ?? DEFAULT_SEO.title;
    const rawDescription = article.content ?? DEFAULT_SEO.description;
    const description = rawDescription
      .slice(0, 155)
      .replace(/\s+/g, " ")
      .trim();
    const ogImage = (article as any).imageUrl ?? DEFAULT_OG_IMAGE;
    const canonicalSlug = article.slug ?? article.id;
    const url = `/article/${canonicalSlug}`;

    let icon = "/icons/newsicons.ico";
    if (domain === "jejutime.com") icon = "/icons/jejutime.ico";
    if (domain === "jejuqq.com") icon = "/icons/jejuqq.ico";
    if (domain === "jejujapan.com") icon = "/icons/jejujapan.ico";

    return {
      title,
      description,
      icons: {
        icon: icon,
      },
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        type: "article",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    const url = `/article/${articleId}`;

    let icon = "/icons/newsicons.ico";
    if (domain === "jejutime.com") icon = "/icons/jejutime.ico";
    if (domain === "jejuqq.com") icon = "/icons/jejuqq.ico";
    if (domain === "jejujapan.com") icon = "/icons/jejujapan.ico";

    return {
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
      icons: {
        icon: icon,
      },
      alternates: {
        canonical: url,
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
    redirect(`/article/${canonicalSlug}`);
  }

  const allArticles = await articlesService.getArticles({
    limit: 50,
    status: "published",
  }, tenantId).catch(() => [] as Awaited<ReturnType<typeof articlesService.getArticles>>);

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

