import Link from "next/link";
import type { Article } from "@/lib/types";

interface FeaturedArticlesSectionProps {
  articles: Article[];
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateContent(content: string | null, maxLength = 100): string {
  if (!content) return "";
  const plain = content.replace(/<[^>]*>/g, "").trim();
  return plain.length <= maxLength ? plain : plain.slice(0, maxLength) + "…";
}

export function FeaturedArticlesSection({
  articles,
}: FeaturedArticlesSectionProps) {
  if (articles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {articles.map((article) => (
        <Link
          key={article.id}
          href={`/article/${article.id}`}
          className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 block"
        >
          <div className="relative h-32 bg-gray-200 overflow-hidden">
            <img
              src={article.imageUrl ?? `https://placehold.co/600x400/e5e7eb/9ca3af?text=${encodeURIComponent(article.title.slice(0, 20))}`}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2">
              <span className="inline-block bg-[#ff4500] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                {article.status ?? "article"}
              </span>
            </div>
          </div>
          <div className="p-3">
            <div className="text-xs text-[#ff4500] font-semibold mb-1 uppercase">
              {article.category.categoryName}
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-[#ff4500] transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {truncateContent(article.content)}
            </p>
            <div className="text-xs text-gray-500">
              {formatDate(article.createdAt)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
