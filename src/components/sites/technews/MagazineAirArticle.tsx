"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StoryImage } from "@/components/StoryImage";
import { articlesApi } from "@/lib/api";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import type { Article } from "@/lib/types";
import { ArticleShare } from "@/components/article/ArticleShare";
import { ArticleImageGallery } from "@/components/article/ArticleImageGallery";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { getTechNewsTheme, techNewsVars } from "./theme";

export default function MagazineAirArticle({
  domain,
  articleId,
  initialOtherArticles = [],
}: {
  domain: string;
  articleId: string;
  initialOtherArticles?: Article[];
}) {
  const router = useRouter();
  const theme = getTechNewsTheme(domain);

  useEffect(() => {
    window.scrollTo(0, 0);
    const lastViewed = localStorage.getItem(`viewed_${articleId}`);
    const now = Date.now();
    const lockTime = 30 * 60 * 1000;
    if (!lastViewed || now - parseInt(lastViewed) > lockTime) {
      articlesApi.recordView(articleId).catch(console.error);
      localStorage.setItem(`viewed_${articleId}`, now.toString());
    }
  }, [articleId]);

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  if (!theme) return null;
  const midArticleConfig = ADSTERRA_CONFIG[theme.key]?.midArticle;
  const vars = techNewsVars(theme);

  if (isLoading) {
    return (
      <div style={vars} className="bg-[var(--tn-bg)] min-h-screen animate-pulse pb-20">
        <div className="max-w-[760px] mx-auto px-4 pt-24 space-y-6">
          <div className="h-3 w-24 bg-[var(--tn-accent-soft)]" />
          <div className="h-14 w-full bg-[var(--tn-accent-soft)]" />
          <div className="h-14 w-1/2 bg-[var(--tn-accent-soft)]" />
          <div className="aspect-[16/10] w-full bg-[var(--tn-accent-soft)] mt-8" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div style={vars} className="flex items-center justify-center py-32 px-6 bg-[var(--tn-bg)] min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-[var(--tn-ink)] font-serif text-2xl font-light mb-3">Nothing here just now.</p>
          <p className="text-[var(--tn-muted)] mb-6">We couldn&apos;t load this piece. Try again in a moment.</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--tn-accent)] hover:text-[var(--tn-ink)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);
  const alsoReading = [...otherArticles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const createdAt = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate = createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const category = normalizeCategoryName(article.category?.categoryName) || "Report";

  function normalizeContent(html: string): string {
    if (!html) return "";
    const hasBlockTags = /<(p|div|h[1-6]|ul|ol|blockquote|section|article)\b/i.test(html);
    if (hasBlockTags) return html;
    return html
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
      .join("");
  }
  function splitHtmlAtMidpoint(html: string): [string, string] {
    if (!html) return ["", ""];
    const mid = Math.floor(html.length / 2);
    const idx = html.indexOf("</p>", mid);
    if (idx === -1) return [html, ""];
    return [html.slice(0, idx + 4), html.slice(idx + 4)];
  }

  const rawHtml = normalizeContent(article.content || "");
  const [firstHtml, secondHtml] = splitHtmlAtMidpoint(rawHtml);
  const plainWords = rawHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  const readMin = Math.max(1, Math.round(plainWords.length / 200));

  return (
    <div style={vars} className="bg-[var(--tn-bg)] min-h-screen pb-28 text-[var(--tn-ink)] font-sans">
      <article className="max-w-[760px] mx-auto px-5 sm:px-6">
        <header className="pt-20 sm:pt-28 pb-12">
          <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--tn-accent)]">{category}</span>
          <h1 className="font-serif text-[2.6rem] sm:text-[3.4rem] font-light leading-[1.14] tracking-[0.005em] mt-6 mb-8">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-[var(--tn-muted)]">
            <span className="text-[var(--tn-ink)]">{theme.byline}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--tn-rule)]" />
            <span>{formattedDate}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--tn-rule)]" />
            <span>{readMin} min</span>
          </div>
        </header>
      </article>

      {article.imageUrl && (
        <figure className="max-w-[1040px] mx-auto px-5 sm:px-6 mb-14">
          <div className="relative aspect-[16/10] w-full bg-[var(--tn-accent-soft)] overflow-hidden">
            <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" priority sizes="(max-width: 1040px) 100vw, 1000px" />
          </div>
        </figure>
      )}

      <article className="max-w-[680px] mx-auto px-5 sm:px-6">
        <div
          className="prose max-w-none text-[19px] leading-[1.9] text-[var(--tn-ink)] font-serif article-body [&_p]:mb-7 [&_h2]:font-serif [&_h2]:font-normal [&_h2]:text-[1.6rem] [&_h2]:tracking-[0.02em] [&_h2]:mt-12"
          dangerouslySetInnerHTML={{ __html: firstHtml }}
        />

        <ArticleImageGallery
          images={article.imageUrls ?? []}
          title={article.title}
          imageWrapperClassName="relative aspect-[16/10] bg-[var(--tn-accent-soft)] overflow-hidden my-12"
        />

        {midArticleConfig && (
          <div className="my-14 flex justify-center border-y border-[var(--tn-rule)] py-7">
            <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
          </div>
        )}

        {secondHtml && (
          <div
            className="prose max-w-none text-[19px] leading-[1.9] text-[var(--tn-ink)] font-serif article-body [&_p]:mb-7"
            dangerouslySetInnerHTML={{ __html: secondHtml }}
          />
        )}

        <ArticleShare site="magazineair" title={article.title} className="mt-16" />
      </article>

      {alsoReading.length > 0 && (
        <section className="max-w-[680px] mx-auto px-5 sm:px-6 mt-20">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--tn-muted)] pb-4 border-b border-[var(--tn-rule)] mb-2">
            Also reading
          </h2>
          <ul className="divide-y divide-[var(--tn-rule)]">
            {alsoReading.map((a) => (
              <li key={a.id}>
                <Link href={`/article/${a.slug || a.id}`} className="group flex items-baseline justify-between gap-6 py-5">
                  <h3 className="font-serif text-lg font-light leading-snug text-[var(--tn-ink)] group-hover:text-[var(--tn-accent)] transition-colors">
                    {a.title}
                  </h3>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--tn-muted)] shrink-0">
                    {normalizeCategoryName(a.category?.categoryName) || "Report"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
