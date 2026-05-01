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
import { ArticleClientShell } from "@/components/ArticleClientShell";
import { resolveTenantIdFromDomain } from "@/lib/tenant";

export const revalidate = 5;

// Dynamic rendering for multi-tenant articles
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; id: string }>;
}): Promise<Metadata> {
  const { domain, id } = await params;
  const articleId = id?.trim() ?? "";
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
    if (domain === "jejutime.com") icon = "/icons/jejutimes.ico";
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
    if (domain === "jejutime.com") icon = "/icons/jejutimes.ico";
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
  const articleId = id?.trim() ?? "";

  if (!articleId) {
    notFound();
  }

  const tenantId = await resolveTenantIdFromDomain(domain);

  if (!tenantId) {
    notFound();
  }

  const queryClient = createQueryClient();

  try {
    const article = await articlesService.getArticleBySlugOrId(articleId, tenantId);
    const canonicalSlug = article.slug ?? article.id;

    // Keep old id links working but redirect to canonical slug URLs.
    if (articleId !== canonicalSlug) {
      redirect(`/article/${canonicalSlug}`);
    }

    queryClient.setQueryData(["article", canonicalSlug], article);
  } catch (error) {
    if (error instanceof ArticlesServiceError && error.status === 404) {
      notFound();
    }
  }

  const allArticles = await articlesService.getArticles({
    limit: 50,
    status: "published",
  }, tenantId);

  const dehydratedState = dehydrate(queryClient);

  return (
    <ArticleClientShell>
      <Hydrate state={dehydratedState}>
        <Suspense fallback={<div className="min-h-[60vh] bg-white" />}>
          {domain === "jejujapan.com" ? (
            <JejuJapanArticle articleId={articleId} initialOtherArticles={allArticles} />
          ) : domain === "jejuqq.com" ? (
            <JejuQQArticle articleId={articleId} initialOtherArticles={allArticles} />
          ) : domain === "jejutime.com" ? (
            <JejuTimeArticle articleId={articleId} initialOtherArticles={allArticles} />
          ) : (
            <ArticlePageClient articleId={articleId} initialOtherArticles={allArticles} />
          )}
        </Suspense>
      </Hydrate>
    </ArticleClientShell>
  );
}

