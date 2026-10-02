import type { Article } from "@/lib/types";
import type { MediaStackArticle } from "@/lib/mediastack";

/**
 * What LatestStoriesSection renders: the fields it reads from a DB article, plus
 * `externalUrl` for rows that link out (MediaStack) instead of to /article/<id>.
 * A DB `Article` satisfies this as-is.
 */
export interface StoryItem
  extends Pick<Article, "id" | "slug" | "title" | "content" | "imageUrl" | "createdAt"> {
  category: { categoryName: string | null } | null;
  externalUrl?: string;
}

export function mediaStackToStory(a: MediaStackArticle): StoryItem {
  return {
    id: a.id,
    slug: null,
    title: a.title,
    content: a.description ?? "",
    imageUrl: a.image,
    createdAt: new Date(a.publishedAt),
    // The card's tag shows where the story comes from.
    category: { categoryName: (a.sourceDomain || a.source).replace(/^www\./, "") },
    externalUrl: a.url,
  };
}
