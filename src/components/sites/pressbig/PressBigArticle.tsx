"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { articlesApi } from "@/lib/api";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import type { Article } from "@/lib/types";
import { ArticleShare } from "@/components/article/ArticleShare";
import { ArticleImageGallery } from "@/components/article/ArticleImageGallery";
import { toFeedRows } from "../technews-shared/feed";
import { Scrap } from "./paper";
import { PressBigAdRail } from "./PressBigAds";
import "./pressbig.css";

function normalizeContent(html: string): string {
  if (!html) return "";
  if (/<(p|div|h[1-6]|ul|ol|blockquote|section|article)\b/i.test(html)) return html;
  return html
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export default function PressBigArticle({
  articleId,
  initialOtherArticles = [],
}: {
  domain: string;
  articleId: string;
  initialOtherArticles?: Article[];
}) {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
    const lastViewed = localStorage.getItem(`viewed_${articleId}`);
    const now = Date.now();
    if (!lastViewed || now - parseInt(lastViewed) > 30 * 60 * 1000) {
      articlesApi.recordView(articleId).catch(console.error);
      localStorage.setItem(`viewed_${articleId}`, now.toString());
    }
  }, [articleId]);

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  if (isLoading) {
    return (
      <div className="pb pb-article" aria-busy="true" aria-label="Loading story">
        <div className="pb-article__sheet pb-paper" style={{ minHeight: "28rem" }} />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="pb pb-article">
        <div className="pb-empty pb-paper" style={{ margin: "0 auto" }}>
          <h2 className="pb-display">This one got torn down.</h2>
          <p>We couldn&apos;t load that story. Try again in a moment.</p>
          <button type="button" className="pb-strip pb-paper" onClick={() => router.push("/")}>
            <ArrowLeft size={16} /> Back to today
          </button>
        </div>
      </div>
    );
  }

  const created = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const date = created.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const category = normalizeCategoryName(article.category?.categoryName) || "";
  const html = normalizeContent(article.content || "");
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  const dek = words.slice(0, 32).join(" ") + (words.length > 32 ? "…" : "");
  const more = toFeedRows(initialOtherArticles.filter((a) => a.id !== article.id).slice(0, 3));

  return (
    <div className="pb pb-article">
      <div className="pb-article__layout">
      <PressBigAdRail side="left" />
      <article className="pb-article__sheet pb-paper">
        {category && <span className="pb-tag">{category}</span>}
        <h1 className="pb-display pb-article__title">{article.title}</h1>
        {dek && <p className="pb-article__dek">{dek}</p>}
        <p className="pb-article__meta">{date}</p>

        {article.imageUrl && (
          <figure className="pb-article__figure">
            <div className="pb-half">
              {/* eslint-disable-next-line @next/next/no-img-element -- article images are served from our own bucket / CDN */}
              <img src={article.imageUrl} alt={article.title} />
            </div>
          </figure>
        )}

        <div className="pb-article__body" dangerouslySetInnerHTML={{ __html: html }} />

        <ArticleImageGallery
          images={article.imageUrls ?? []}
          title={article.title}
          imageWrapperClassName="relative aspect-[3/2] bg-[#b8b6ad] overflow-hidden my-8"
        />

        <ArticleShare site="pressbig" title={article.title} className="mt-12" />
      </article>
      <PressBigAdRail side="right" />
      </div>

      {more.length > 0 && (
        <section className="pb-article__more" aria-labelledby="pb-more-picks">
          <h2 id="pb-more-picks" className="pb-display">
            More from the wall
          </h2>
          <ul className="pb-more__grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))" }}>
            {more.map((row) => (
              <li key={row.id}>
                <Scrap row={row} />
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "2rem" }}>
            <Link href="/" className="pb-strip pb-paper">
              Back to today
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
