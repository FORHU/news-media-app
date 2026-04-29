import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";

export type FetchGeneratedArticlesParams = {
  q: string;
  offset: number;
  limit: number;
  category?: string;
  status?: string;
  tenantId?: string;
};

type ContentArticleSupabase = {
  id: string;
  category_id: string;
  title: string;
  content: string;
  image_url: string | null;
  youtube_url: string | null;
  source_type: "ARTICLE" | "TWEET" | "VIDEO" | "UPLOAD" | "MANUAL" | null;
  publish_date: string | null;
  created_at: string;
  status: string;
  category: { id: string; category_name: string } | null;
  user: { first_name: string; last_name: string } | null;
  rawArticle: {
    id: string;
    title: string;
    content: string | null;
    image_url: string | null;
    youtube_url: string | null;
    publish_date: string | null;
    created_at: string;
    status: string;
    category: { id: string; category_name: string } | null;
    crawledUrl: { url: string } | null;
  } | null;
  rawVideo: {
    id: string;
    language: string | null;
    youtube_url: string;
    transcribed_content: string;
    prompt: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  rawSourceUpload: {
    id: string;
    prompt: string | null;
    s3_image_url: string | null;
    language: string | null;
    extracted_text: string | null;
    created_at: string;
    updated_at: string;
  } | null;
};

export const generatedArticlesRepository = {
  async fetchGeneratedArticles(params: FetchGeneratedArticlesParams): Promise<{
    data: ContentArticleSupabase[];
    count: number;
  }> {
    const { q, offset, limit, category, status, tenantId } = params;
    const where: Prisma.ContentArticleWhereInput = {};
    const and: Prisma.ContentArticleWhereInput[] = [];

    if (tenantId) {
      and.push({ tenantId });
    }

    if (q?.trim()) {
      and.push({
        OR: [
          { title: { contains: q.trim(), mode: "insensitive" } },
          { content: { contains: q.trim(), mode: "insensitive" } },
        ],
      });
    }

    if (category && category !== "All Types") {
      and.push({
        category: {
          categoryName: {
            equals: category,
            mode: "insensitive",
          },
        },
      });
    }

    if (status && status !== "All Status" && status !== "all") {
      and.push({
        status: status.toLowerCase(),
      });
    }

    if (and.length > 0) where.AND = and;

    const [rows, count] = await prisma.$transaction([
      prisma.contentArticle.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [
          { publishDate: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        include: {
          category: true,
          user: true,
          rawArticle: {
            include: {
              category: true,
              crawledUrl: true,
            },
          },
          rawVideo: true,
          rawSourceUpload: true,
        },
      }),
      prisma.contentArticle.count({ where }),
    ]);

    const data: ContentArticleSupabase[] = rows.map((row) => ({
      id: row.id,
      category_id: row.categoryId,
      title: row.title,
      content: row.content,
      image_url: row.imageUrl,
      youtube_url: row.youtubeUrl,
      source_type: row.sourceType,
      publish_date: row.publishDate ? row.publishDate.toISOString() : null,
      created_at: row.createdAt.toISOString(),
      status: row.status,
      category: row.category
        ? { id: row.category.id, category_name: row.category.categoryName }
        : null,
      user: row.user
        ? { first_name: row.user.firstName, last_name: row.user.lastName }
        : null,
      rawArticle: row.rawArticle
        ? {
            id: row.rawArticle.id,
            title: row.rawArticle.title,
            content: row.rawArticle.content,
            image_url: row.rawArticle.imageUrl,
            youtube_url: null,
            publish_date: row.rawArticle.publishDate ? row.rawArticle.publishDate.toISOString() : null,
            created_at: row.rawArticle.createdAt.toISOString(),
            status: row.rawArticle.status,
            category: row.rawArticle.category
              ? {
                  id: row.rawArticle.category.id,
                  category_name: row.rawArticle.category.categoryName,
                }
              : null,
            crawledUrl: row.rawArticle.crawledUrl
              ? { url: row.rawArticle.crawledUrl.url }
              : null,
          }
        : null,
      rawVideo: row.rawVideo
        ? {
            id: row.rawVideo.id,
            language: row.rawVideo.language,
            youtube_url: row.rawVideo.youtubeUrl,
            transcribed_content: row.rawVideo.transcribedContent,
            prompt: row.rawVideo.prompt,
            created_at: row.rawVideo.createdAt.toISOString(),
            updated_at: row.rawVideo.updatedAt.toISOString(),
          }
        : null,
      rawSourceUpload: row.rawSourceUpload
        ? {
            id: row.rawSourceUpload.id,
            prompt: row.rawSourceUpload.prompt,
            s3_image_url: row.rawSourceUpload.s3ImageUrl,
            language: row.rawSourceUpload.language,
            extracted_text: row.rawSourceUpload.extractedText,
            created_at: row.rawSourceUpload.createdAt.toISOString(),
            updated_at: row.rawSourceUpload.updatedAt.toISOString(),
          }
        : null,
    }));

    return {
      data,
      count,
    };
  },

  async updateStatus(id: string, status: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      await prisma.contentArticle.updateMany({
        where: { id, tenantId },
        data: { status },
      });
      return;
    }

    await prisma.contentArticle.update({
      where: { id },
      data: { status },
    });
  },
};
