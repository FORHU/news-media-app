import type { Article } from "@/lib/types";
import { ArticleLink } from "@/components/home/ArticleLink";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

interface TrendingSidebarProps {
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

export function TrendingSidebar({ articles }: TrendingSidebarProps) {
  return (
    <aside id="trending-stories" className="lg:col-span-1 scroll-mt-24">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Trending Stories</h2>
        </div>

        <div className="space-y-5">
          {articles.map((article, index) => (
            <ArticleLink
              key={article.id}
              articleIdentifier={article.slug ?? article.id}
              href={`/article/${article.slug ?? article.id}`}
              className="group cursor-pointer flex gap-3 hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2 block"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#ff4500] text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {normalizeCategoryName(article.category?.categoryName) ? (
                  <div className="text-xs text-[#ff4500] font-semibold mb-1 uppercase">
                    {normalizeCategoryName(article.category?.categoryName)}
                  </div>
                ) : null}
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#ff4500] transition-colors line-clamp-2 mb-1">
                  {article.title}
                </h3>
                <div className="text-xs text-gray-500">
                  {formatDate(article.createdAt)}
                </div>
              </div>
            </ArticleLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
