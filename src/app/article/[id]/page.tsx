import { dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { createQueryClient } from "@/lib/react-query";
import { Hydrate } from "@/components/react-query/Hydrate";
import {
  articlesService,
  ArticlesServiceError,
} from "@/app/api/services/articles.service";
import ArticlePageClient from "./ArticlePageClient";

export const revalidate = 3600;

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
      <ArticlePageClient articleId={articleId} />
    </Hydrate>
  );
}
