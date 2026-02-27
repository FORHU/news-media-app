import { notFound } from "next/navigation";
import type { Article } from "@/lib/types";
import { ArticlePageClient } from "./ArticlePageClient";
import {
  articlesService,
  ArticlesServiceError,
} from "@/app/api/services/articles.service";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

async function getArticleData(idParam: string): Promise<{
  article: Article;
  trendingArticles: Article[];
  recommendedArticles: Article[];
}> {
  const numId = Number(idParam);
  if (!numId || Number.isNaN(numId)) {
    notFound();
  }

  let article: Article;
  try {
    article = await articlesService.getArticleById(numId);
  } catch (err) {
    if (err instanceof ArticlesServiceError && err.status === 404) {
      notFound();
    }
    notFound();
  }

  let allArticles: Article[] = [];
  try {
    allArticles = await articlesService.getArticles({ limit: 50, search: null });
  } catch {
    // If this fails, we can still render the main article
    allArticles = [];
  }

  const otherArticles = allArticles.filter((a) => a.id !== article.id);
  const trendingArticles = otherArticles.slice(0, 5);
  const recommendedArticles = otherArticles.slice(0, 4);

  return { article, trendingArticles, recommendedArticles };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const { article, trendingArticles, recommendedArticles } =
    await getArticleData(resolvedParams.id);

  return (
    <ArticlePageClient
      article={article}
      trendingArticles={trendingArticles}
      recommendedArticles={recommendedArticles}
    />
  );
}
