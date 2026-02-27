import type { Article } from "@/lib/types";
import { HomePageClient } from "./HomePageClient";
import {
  articlesService,
  ArticlesServiceError,
} from "@/app/api/services/articles.service";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams.search ?? null;
  const categoryParam = resolvedSearchParams.category ?? null;

  let articles: Article[] = [];
  let error = "";

  try {
    articles = await articlesService.getArticles({
      limit: 50,
      search: searchQuery,
    });
  } catch (err) {
    if (err instanceof ArticlesServiceError) {
      error = err.message;
    } else {
      error = "Failed to load articles";
    }
  }

  let filteredArticles = articles;
  if (categoryParam) {
    filteredArticles = filteredArticles.filter(
      (article) => article.category.categoryName === categoryParam
    );
  }
  if (searchQuery) {
    filteredArticles = filteredArticles.filter((article) => {
      const query = searchQuery.toLowerCase();
      const content = article.content?.toLowerCase() ?? "";
      return (
        article.title.toLowerCase().includes(query) ||
        content.includes(query) ||
        article.category.categoryName.toLowerCase().includes(query)
      );
    });
  }

  return (
    <HomePageClient
      articles={filteredArticles}
      searchQuery={searchQuery}
      categoryParam={categoryParam}
      error={error}
    />
  );
}
