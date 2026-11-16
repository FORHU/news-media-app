"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { articlesApi } from "@/lib/api";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import type { Article } from "@/lib/types";
import { ArticleShare } from "@/components/article/ArticleShare";
import { ArticleImageGallery } from "@/components/article/ArticleImageGallery";
import { FacetLink } from "@/components/FacetLink";
import { toFeedRows } from "../technews-shared/feed";
import { StoryCard } from "./parts";
import { sectionHref } from "./edit";
import { GolfCarrierAdRail } from "./GolfCarrierAds";
import "./golfcarrier.css";

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

export default function GolfCarrierArticle({
  articleId,
  initialOtherArticles = [],
}: {
  domain: string;
  articleId: string;
  initialOtherArticles?: Article[];
}) {
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
      <div className="gc gc-article" aria-busy="true" aria-label="Loading story">
        <div className="gc-wrap">
          <div className="gc-article__main" style={{ minHeight: "32rem" }} />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="gc gc-article">
        <div className="gc-wrap">
          <div className="gc-empty">
            <h2>Out of bounds.</h2>
            <p>We couldn&apos;t load that story. Try again in a moment.</p>
            <Link href="/" className="gc-btn">
              <ArrowLeft size={16} /> Back to the latest
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const created = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const date = created.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const category = normalizeCategoryName(article.category?.categoryName) || "";
  const html = normalizeContent(article.content || "");
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  const readMins = Math.max(1, Math.round(words.length / 230));
  const more = toFeedRows(initialOtherArticles.filter((a) => a.id !== article.id).slice(0, 3));

  return (
    <div className="gc gc-article">
      <div className="gc-wrap">
        <div className="gc-article__layout">
          <GolfCarrierAdRail side="left" />

          <article className="gc-article__main">
            <Link href="/" className="gc-back">
              <ArrowLeft size={15} /> Latest
            </Link>
            <div>
              {category && (
                <FacetLink href={sectionHref(category)} className="gc-kicker">
                  {category}
                </FacetLink>
              )}
            </div>
            <h1 className="gc-article__title">{article.title}</h1>
            <p className="gc-meta gc-article__meta">
              <time dateTime={created.toISOString()}>{date}</time>
              <span aria-hidden="true">·</span>
              <span>{readMins} min read</span>
            </p>

            {article.imageUrl && (
              <figure className="gc-article__figure">
                {/* eslint-disable-next-line @next/next/no-img-element -- article images are served from our own bucket / CDN */}
                <img src={article.imageUrl} alt={article.title} />
              </figure>
            )}

            <div className="gc-article__body" dangerouslySetInnerHTML={{ __html: html }} />

            <ArticleImageGallery
              images={article.imageUrls ?? []}
              title={article.title}
              imageWrapperClassName="relative aspect-[3/2] bg-[#11724C] overflow-hidden my-8 rounded-xl"
            />

            <ArticleShare site="golfcarrier" title={article.title} className="mt-12" />
          </article>

          <GolfCarrierAdRail side="right" />
        </div>

        {more.length > 0 && (
          <section className="gc-article__more" aria-labelledby="gc-more-stories">
            <h2 id="gc-more-stories">More golf news</h2>
            <ul>
              {more.map((row) => (
                <li key={row.id}>
                  <StoryCard row={row} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
