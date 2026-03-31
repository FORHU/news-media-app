import {
  generatedArticlesRepository,
  type FetchGeneratedArticlesParams,
} from "@/repositories/admin/generatedArticles.repository";

export type GetGeneratedArticlesParams = {
  q: string;
  page: number;
  limit: number;
  category?: string;
};

export const generatedArticlesService = {
  async getGeneratedArticles(params: GetGeneratedArticlesParams) {
    const offset = (params.page - 1) * params.limit;

    const repositoryParams: FetchGeneratedArticlesParams = {
      q: params.q,
      offset,
      limit: params.limit,
      category: params.category,
    };

    const { data, count } = await generatedArticlesRepository.fetchGeneratedArticles(repositoryParams);

    const articles = data.map((article) => {
      const rawImg = article.image_url;
      const imageUrl =
        typeof rawImg === "string" && rawImg.trim().length > 0
          ? rawImg.trim()
          : null;

      return {
        id: article.id,
        title: article.title,
        content: article.content,
        imageUrl,
        publishDate: article.publish_date,
        createdAt: article.created_at,
        status: article.status,
        category: {
          categoryName: article.category?.category_name || "Uncategorized",
        },
        user: {
          firstName: article.user?.first_name || "",
          lastName: article.user?.last_name || "",
        },
      };
    });

    return {
      articles,
      pagination: {
        total: count,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(count / params.limit),
      },
    };
  },
};
