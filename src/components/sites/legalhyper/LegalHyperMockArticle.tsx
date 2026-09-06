"use client"; // LegalHyper static mock article view — no DB/API involved ("The Legal Review" design)

import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { StoryImage } from "@/components/StoryImage";
import type { MockArticle } from "./mockArticles";

const INK_DARK = "#0B1424";
const GOLD = "#8A6A22";
const BRASS = "#B08D3F";
const PARCHMENT = "#F4F0E6";

function readingMinutes(content?: string | null) {
  const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function LegalHyperMockArticle({
  article,
  otherArticles,
}: {
  article: MockArticle;
  otherArticles: MockArticle[];
}) {
  const recommended = otherArticles.filter((a) => a.id !== article.id).slice(0, 4);

  const paragraphs = (article.content ?? "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="font-chivo min-h-screen pb-20" style={{ background: PARCHMENT, color: "#1A1A16" }}>
      {/* Masthead header */}
      <div style={{ background: INK_DARK, color: "#EDE9DE" }} className="pt-9 pb-12">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-7">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-[10px] font-bold uppercase px-5 py-2.5"
            style={{ letterSpacing: "0.4em", color: "#C9CEDA", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {article.category?.categoryName ? `Back to ${article.category.categoryName}` : "Back to feed"}
          </Link>

          <div className="max-w-[860px] mt-8">
            {article.category?.categoryName && (
              <span className="text-[10.5px] font-bold uppercase block mb-4" style={{ letterSpacing: "0.26em", color: BRASS }}>
                {article.category.categoryName}
              </span>
            )}
            <h1
              className="font-bodoni font-medium uppercase m-0"
              style={{ fontSize: "clamp(30px,4.6vw,54px)", lineHeight: 1.08, color: "#F4F0E6" }}
            >
              {article.title}
            </h1>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-6 pt-5 text-[11px] uppercase"
              style={{ letterSpacing: "0.14em", color: "#8E97A8", borderTop: "1px solid #26314A" }}
            >
              <span style={{ color: "#F4F0E6", fontWeight: 600 }}>By {article.author}</span>
              <span className="w-px h-2.5" style={{ background: "#3A465F" }} />
              <span>{formatDate(article.createdAt)}</span>
              <span className="w-px h-2.5" style={{ background: "#3A465F" }} />
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {readingMinutes(article.content)} min read
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-7">
        <article className="max-w-[720px] mx-auto pt-11">
          <div className="relative w-full aspect-video overflow-hidden bg-[#E3DECF] mb-9" style={{ border: "1px solid #DCD5C2" }}>
            <StoryImage src={article.imageUrl} alt={article.title} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 720px" />
          </div>

          <div className="text-[18px] leading-[1.75] space-y-6" style={{ color: "#1A1A16" }}>
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p className="italic" style={{ color: "#8A8A7C" }}>
                Placeholder body copy — this is a static preview article with no full body text yet.
              </p>
            )}
          </div>

          <div className="mt-12 pt-6" style={{ borderTop: "1px solid #DCD5C2" }}>
            <p className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: "#8A8A7C" }}>
              Static preview content — not a real published article.
            </p>
          </div>
        </article>
      </div>

      {recommended.length > 0 && (
        <section style={{ background: INK_DARK, color: "#EDE9DE" }} className="mt-16 py-14">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-7">
            <h2 className="text-[11px] font-bold uppercase mb-9 text-center" style={{ letterSpacing: "0.5em", color: "#8E97A8" }}>
              Continue Reading
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0" style={{ borderTop: "1px solid #26314A" }}>
              {recommended.map((rec, i) => (
                <Link
                  key={rec.id}
                  href={`/article/${rec.id}`}
                  className="group flex flex-col h-full p-6 hover:bg-white/5 transition-all"
                  style={{ borderRight: i < recommended.length - 1 ? "1px solid #26314A" : "none" }}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden mb-5" style={{ background: "#16223A" }}>
                    <StoryImage src={rec.imageUrl} alt={rec.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
                  </div>
                  <span className="text-[9px] font-bold uppercase mb-3" style={{ letterSpacing: "0.3em", color: GOLD }}>
                    {rec.category?.categoryName}
                  </span>
                  <h3 className="font-garamond font-semibold text-2xl leading-tight" style={{ color: "#F4F0E6" }}>
                    {rec.title}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-bold uppercase" style={{ letterSpacing: "0.2em", color: "#8E97A8" }}>
                    <Clock size={12} />
                    {readingMinutes(rec.content)} min read
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
