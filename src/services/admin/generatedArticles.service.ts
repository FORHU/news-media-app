import {
  generatedArticlesRepository,
  type FetchGeneratedArticlesParams,
} from "@/repositories/admin/generatedArticles.repository";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

type GetGeneratedArticlesParams = {
  q: string;
  page: number;
  limit: number;
  category?: string;
  status?: string;
};

export const generatedArticlesService = {
  async getGeneratedArticles(
    params: GetGeneratedArticlesParams,
    tenantId?: string | null
  ) {
    const offset = (params.page - 1) * params.limit;

    const repositoryParams: FetchGeneratedArticlesParams = {
      q: params.q,
      offset,
      limit: params.limit,
      category: params.category,
      status: params.status,
      tenantId: tenantId ?? undefined,
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
        youtubeUrl: article.youtube_url,
        sourceType: article.source_type ?? null,
        publishDate: article.publish_date,
        createdAt: article.created_at,
        status: article.status,
        category: {
          id: article.category?.id || "",
          categoryName: normalizeCategoryName(article.category?.category_name) || "",
        },
        categoryId: article.category_id || article.category?.id || "",
        user: {
          firstName: article.user?.first_name || "",
          lastName: article.user?.last_name || "",
        },
        rawArticle: article.rawArticle ? {
          id: article.rawArticle.id || "",
          title: article.rawArticle.title || "",
          content: article.rawArticle.content || "",
          imageUrl: article.rawArticle.image_url || null,
          publishDate: article.rawArticle.publish_date || article.rawArticle.created_at,
          createdAt: article.rawArticle.created_at,
          status: article.rawArticle.status,
          category: {
            categoryName: normalizeCategoryName(article.rawArticle.category?.category_name) || "",
          },
          crawledUrl: {
            url: article.rawArticle.crawledUrl?.url || "",
          },
        } : null,
        rawVideo: article.rawVideo
          ? {
              id: article.rawVideo.id,
              language: article.rawVideo.language,
              youtubeUrl: article.rawVideo.youtube_url,
              transcribedContent: article.rawVideo.transcribed_content,
              prompt: article.rawVideo.prompt,
              generationMode: article.rawVideo.generation_mode,
              createdAt: article.rawVideo.created_at,
              updatedAt: article.rawVideo.updated_at,
            }
          : null,
        rawSourceUpload: article.rawSourceUpload
          ? {
              id: article.rawSourceUpload.id,
              prompt: article.rawSourceUpload.prompt,
              s3ImageUrl: article.rawSourceUpload.s3_image_url,
              language: article.rawSourceUpload.language,
              extractedText: article.rawSourceUpload.extracted_text,
              createdAt: article.rawSourceUpload.created_at,
              updatedAt: article.rawSourceUpload.updated_at,
            }
          : null,
        rawTweet: article.rawTweet
          ? {
              tweetId: article.rawTweet.tweet_id,
              generationMode: article.rawTweet.generation_mode,
              profileUrl: article.rawTweet.profile_url,
            }
          : null,
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

  async publishArticle(id: string, tenantId?: string | null) {
    return generatedArticlesRepository.updateStatus(
      id,
      "published",
      tenantId ?? undefined
    );
  },

  async unpublishArticle(id: string, tenantId?: string | null) {
    return generatedArticlesRepository.updateStatus(
      id,
      "pending",
      tenantId ?? undefined
    );
  },
};
