"use client";

import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";

interface ArticleRow {
  id: string;
  slug?: string | null;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  category?: { categoryName?: string | null } | null;
}

interface CategoryGroup {
  name: string;
  items: ArticleRow[];
}

interface Props {
  categories: CategoryGroup[];
}

function articleHref(a: { slug?: string | null; id: string }) {
  return `/article/${a.slug || a.id}`;
}

function excerpt(text: string | null | undefined, max = 100) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

export default function LavagueTechCategoryPreview({ categories }: Props) {
  if (!categories.length) return null;

  return (
    <div className="space-y-14">
      {categories.map((group) => {
        const lead = group.items[0];
        const rest = group.items.slice(1, 4);
        if (!lead) return null;

        return (
          <section key={group.name}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-blue-600/20">
              <span className="w-1 h-6 bg-blue-700 inline-block rounded-full shrink-0" />
              <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.25em]">{group.name}</h2>
              <div className="flex-1 h-px bg-gray-200" />
              <Link
                href={`/search?category=${encodeURIComponent(group.name)}`}
                className="text-[10px] font-bold uppercase tracking-widest text-blue-700 hover:text-blue-600 transition-colors shrink-0"
              >
                See All →
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Lead article */}
              <Link
                href={articleHref(lead)}
                className="lg:col-span-5 group block bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                  <StoryImage
                    src={lead.imageUrl}
                    alt={lead.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 block mb-2">
                    {lead.category?.categoryName ?? group.name}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors mb-2 line-clamp-3">
                    {lead.title}
                  </h3>
                  <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">
                    {excerpt(lead.content, 120)}
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium mt-3 block">
                    {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </Link>

              {/* Side articles */}
              {rest.length > 0 && (
                <div className="lg:col-span-7 flex flex-col divide-y divide-gray-200 bg-white border border-gray-200">
                  {rest.map((article) => (
                    <Link
                      key={article.id}
                      href={articleHref(article)}
                      className="group flex gap-4 items-start p-4 hover:bg-blue-50 transition-colors"
                    >
                      <div className="relative w-[96px] h-[68px] shrink-0 bg-gray-100 overflow-hidden">
                        <StoryImage
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="96px"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                          {article.category?.categoryName ?? group.name}
                        </span>
                        <h4 className="text-[14px] font-bold text-gray-800 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">
                          {excerpt(article.content, 70)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
