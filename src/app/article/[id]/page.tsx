import type { Metadata } from "next";
import { Suspense } from "react";
import { dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { createQueryClient } from "@/lib/react-query";
import { Hydrate } from "@/components/react-query/Hydrate";
import {
  articlesService,
  ArticlesServiceError,
} from "@/services/articles.service";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO } from "@/config/site";
import ArticlePageClient from "./ArticlePageClient";

export const revalidate = 300;

export async function generateStaticParams() {
  const articles = await articlesService.getArticles({ limit: 100 });
  return articles.map((article) => ({
    id: article.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const articleId = id?.trim() ?? "";

  if (!articleId) {
    return {
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
    };
  }

  try {
    const article = await articlesService.getArticleById(articleId);
    const title = article.title ?? DEFAULT_SEO.title;
    const rawDescription = article.content ?? DEFAULT_SEO.description;
    const description = rawDescription
      .slice(0, 155)
      .replace(/\s+/g, " ")
      .trim();
    const ogImage = (article as any).imageUrl ?? DEFAULT_OG_IMAGE;
    const url = `/article/${articleId}`;

    return {
      title,
      description,
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
    return {
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
      alternates: {
        canonical: url,
      },
    };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = id?.trim() ?? "";

  if (!articleId) {
    notFound();
  }

  const queryClient = createQueryClient();

  try {
    const article = await articlesService.getArticleById(articleId);
    queryClient.setQueryData(["article", articleId], article);
  } catch (error) {
    if (error instanceof ArticlesServiceError && error.status === 404) {
      notFound();
    }

    // Any other server-side failure should not hard-404 the page.
    // We fall back to client fetching so users still get a usable screen.
  }

  // We only fetch the main article on the server for SEO and initial render.
  // Secondary content (sidebar/recommendations) will be fetched on the client.
  const dehydratedState = dehydrate(queryClient);

  return (
    <Hydrate state={dehydratedState}>
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <ArticlePageClient articleId={articleId} />
      </Suspense>
    </Hydrate>
  );
}
