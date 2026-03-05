import { dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { createQueryClient } from "@/lib/react-query";
import { Hydrate } from "@/components/react-query/Hydrate";
import {
  articlesService,
  ArticlesServiceError,
} from "@/app/api/services/articles.service";
import ArticlePageClient from "./ArticlePageClient";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = Number.parseInt(id, 10);

  if (!Number.isFinite(articleId) || articleId <= 0) {
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

  try {
    const articles = await articlesService.getArticles({ limit: 50 });
    queryClient.setQueryData(["articles"], articles);
  } catch {
    // Optional hydration; ignore and let the client fetch if needed.
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <Hydrate state={dehydratedState}>
      <ArticlePageClient articleId={articleId} />
    </Hydrate>
  );
}
