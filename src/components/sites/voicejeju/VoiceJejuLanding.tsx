"use client"; // VoiceJeju Landing Component

import dynamic from "next/dynamic";
import type { Banner } from "@/components/AdBanner";
const AdBanner = dynamic(() => import("@/components/AdBanner").then(mod => mod.AdBanner), {
   ssr: true,
   loading: () => <div className="h-[120px] animate-pulse bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase tracking-widest" />
});
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TENANT_CATEGORIES } from "@/config/categories";

/** Narrow shape for home feed rows (server passes Prisma-shaped articles). */
interface LandingArticle {
   id: string;
   slug?: string | null;
   title: string;
   content?: string | null;
   imageUrl?: string | null;
   createdAt: string | Date;
   trendingScore?: number | null;
   status?: string | null;
   category?: { categoryName?: string | null } | null;
}

interface Props {
   tenantId: string | null;
   articles: LandingArticle[];
   banners: {
      top: Banner[];
      sidebar: Banner[];
      footer: Banner[];
      sideLTop?: Banner[];
      sideLMid?: Banner[];
      sideRMid?: Banner[];
      sideRBtm?: Banner[];
   };
}

function articleHref(article: { slug?: string | null; id: string }) {
   return `/article/${article.slug || article.id}`;
}

function CompactArticleRow({
   article,
   showSnippet,
}: {
   article: LandingArticle;
   showSnippet?: boolean;
}) {
   return (
      <Link
         href={articleHref(article)}
         className="flex gap-3 group items-start border-b border-gray-100 py-2.5 sm:py-3 hover:bg-gray-50/90 transition-colors"
      >
         <div className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover group-hover:scale-105 transition-transform duration-300"
               sizes="160px"
            />
         </div>
         <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-1">
               {article.category?.categoryName}
            </span>
            <h3 className="text-[14px] sm:text-[15px] font-normal font-voltaire leading-snug text-gray-900 group-hover:underline line-clamp-2">
               {article.title}
            </h3>
            {showSnippet && (
               <p className="text-[11px] text-gray-600 line-clamp-2 mt-1 leading-relaxed font-medium">
                  {article.content}
               </p>
            )}
         </div>
      </Link>
   );
}

/** Rotating layout pattern for the left “Latest” column (not a plain uniform list). */
function latestLeftVariant(index: number): "featured" | "wire" | "split" | "reverse" | "compact" {
   if (index === 0) return "featured";
   const m = index % 5;
   if (m === 3) return "wire";
   if (m === 1) return "split";
   if (m === 4) return "reverse";
   return "compact";
}

function LatestSidebarFeatured({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="block group border-b-2 border-black py-3 px-0 hover:bg-gray-50/80 transition-colors"
      >
         <div className="relative aspect-[5/3] w-full overflow-hidden mb-2.5 border border-gray-200">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
               sizes="(max-width: 1280px) 30vw, 360px"
            />
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
            <span className="absolute bottom-2 left-2 text-[10px] font-black uppercase tracking-[0.25em] text-white drop-shadow-sm">
               {article.category?.categoryName}
            </span>
         </div>
         <h3 className="text-[17px] sm:text-lg font-normal font-voltaire leading-[1.15] text-gray-900 group-hover:underline line-clamp-3 tracking-tight">
            {article.title}
         </h3>
      </Link>
   );
}

function LatestSidebarWire({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="flex gap-3 group items-start border-b border-gray-100 py-2.5 pl-3 border-l-[3px] border-l-black hover:bg-gray-50/80 transition-colors"
      >
         <div className="relative w-20 h-20 shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover group-hover:scale-105 transition-transform duration-300"
               sizes="160px"
            />
         </div>
         <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.35em] block mb-1.5">
               {article.category?.categoryName}
            </span>
            <p className="text-[13px] font-voltaire leading-snug text-gray-900 group-hover:underline line-clamp-3">
               {article.title}
            </p>
         </div>
      </Link>
   );
}

function LatestSidebarSplit({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="flex gap-3 group items-stretch border-b border-gray-100 py-3 hover:bg-gray-50/90 transition-colors"
      >
         <div className="relative w-20 h-20 shrink-0 overflow-hidden bg-gray-50 border border-gray-900/15">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover group-hover:scale-105 transition-transform duration-300"
               sizes="160px"
            />
         </div>
         <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-1">
               {article.category?.categoryName}
            </span>
            <h3 className="text-[15px] font-normal font-voltaire leading-snug text-gray-900 group-hover:underline line-clamp-3">
               {article.title}
            </h3>
            {article.content && (
               <p className="text-[10px] text-gray-600 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                  {article.content}
               </p>
            )}
         </div>
      </Link>
   );
}

function LatestSidebarReverse({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="flex flex-row-reverse gap-3 group items-start border-b border-gray-100 py-2.5 sm:py-3 hover:bg-gray-50/90 transition-colors"
      >
         <div className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover group-hover:scale-105 transition-transform duration-300"
               sizes="160px"
            />
         </div>
         <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-1">
               {article.category?.categoryName}
            </span>
            <h3 className="text-[14px] sm:text-[15px] font-normal font-voltaire leading-snug text-gray-900 group-hover:underline line-clamp-2">
               {article.title}
            </h3>
         </div>
      </Link>
   );
}

function LatestSidebarEntry({ article, index }: { article: LandingArticle; index: number }) {
   switch (latestLeftVariant(index)) {
      case "featured":
         return <LatestSidebarFeatured article={article} />;
      case "wire":
         return <LatestSidebarWire article={article} />;
      case "split":
         return <LatestSidebarSplit article={article} />;
      case "reverse":
         return <LatestSidebarReverse article={article} />;
      default:
         return <CompactArticleRow article={article} />;
   }
}

/** Rotating layouts for the right “In depth” block (distinct from Latest). */
function inDepthVariant(index: number): "lead" | "splitBottom" | "excerptBar" | "compact" | "overline" | "ribbon" {
   const cycle: ("lead" | "splitBottom" | "excerptBar" | "compact" | "overline" | "ribbon")[] = [
      "lead",
      "splitBottom",
      "excerptBar",
      "compact",
      "overline",
      "ribbon",
   ];
   return cycle[index % cycle.length] ?? "compact";
}

function InDepthCompactRow({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="flex gap-3 group items-start border-b border-stone-200/70 py-3 px-0 last:border-b-0 hover:bg-stone-50 transition-colors"
      >
         <div className="relative w-16 h-16 shrink-0 overflow-hidden bg-stone-100 border border-stone-200/80">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover transition-transform duration-300 group-hover:scale-105"
               sizes="128px"
            />
         </div>
         <div className="min-w-0 flex-1 pt-0.5">
            <span className="text-[10px] font-medium text-stone-500 tracking-wide block mb-1">
               {article.category?.categoryName}
            </span>
            <h3 className="text-[14px] font-inter font-semibold leading-snug text-stone-900 group-hover:underline decoration-stone-400 underline-offset-2 line-clamp-2">
               {article.title}
            </h3>
            {article.content && (
               <p className="text-[11px] text-stone-600 line-clamp-2 mt-1 leading-relaxed font-normal">
                  {article.content}
               </p>
            )}
         </div>
      </Link>
   );
}

function InDepthLead({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="group block border-b border-stone-200/70 py-3 px-0 hover:bg-stone-50 transition-colors"
      >
         <div className="relative aspect-[8/5] w-full overflow-hidden mb-3 border border-stone-200/80">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
               sizes="(max-width: 1280px) 28vw, 260px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/45 via-stone-900/5 to-transparent pointer-events-none" />
         </div>
         <span className="text-[10px] font-medium text-stone-500 tracking-wide block mb-1">
            {article.category?.categoryName}
         </span>
         <h3 className="text-[16px] font-voltaire font-light leading-[1.2] text-stone-900 group-hover:underline decoration-stone-400 line-clamp-3 tracking-wide">
            {article.title}
         </h3>
         {article.content && (
            <p className="text-[11px] text-stone-600 line-clamp-2 mt-2 leading-relaxed font-inter font-normal">
               {article.content}
            </p>
         )}
      </Link>
   );
}

function InDepthSplitBottom({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="group flex flex-col border-b border-stone-200/70 py-3 px-0 hover:bg-stone-50 transition-colors"
      >
         <span className="text-[10px] font-medium text-stone-500 tracking-wide mb-1">
            {article.category?.categoryName}
         </span>
         <h3 className="text-[15px] font-inter font-semibold leading-snug text-stone-900 group-hover:underline decoration-stone-400 line-clamp-2 mb-2.5">
            {article.title}
         </h3>
         <div className="relative h-[5rem] w-full overflow-hidden border border-stone-200/80 shrink-0 mt-auto">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover group-hover:scale-105 transition-transform duration-300"
               sizes="360px"
            />
         </div>
      </Link>
   );
}

function InDepthExcerptBar({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="group block border-b border-stone-200/70 py-3 px-0 hover:bg-stone-50 transition-colors"
      >
         {article.content && (
            <p className="text-[11px] text-stone-700 leading-relaxed line-clamp-3 font-inter italic mb-2.5 border-l-[3px] border-stone-400 pl-3">
               {article.content}
            </p>
         )}
         <span className="text-[10px] font-medium text-stone-500 tracking-wide block mb-1">
            {article.category?.categoryName}
         </span>
         <h3 className="text-[14px] font-voltaire font-light leading-snug text-stone-900 group-hover:underline decoration-stone-400 line-clamp-2 tracking-wide">
            {article.title}
         </h3>
      </Link>
   );
}

function InDepthOverline({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="group block border-b border-stone-200/70 py-4 px-0 hover:bg-stone-50 transition-colors"
      >
         <span className="text-[10px] font-medium text-stone-500 tracking-[0.12em] block mb-2">
            {article.category?.categoryName}
         </span>
         <h3 className="text-[17px] font-voltaire font-light leading-[1.15] text-stone-900 group-hover:underline decoration-stone-400 line-clamp-3 tracking-wide mb-2">
            {article.title}
         </h3>
         {article.content && (
            <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed font-inter">
               {article.content}
            </p>
         )}
      </Link>
   );
}

function InDepthRibbon({ article }: { article: LandingArticle }) {
   return (
      <Link
         href={articleHref(article)}
         className="flex gap-3 group items-center border-b border-stone-200/70 py-3 px-0 hover:bg-stone-50 transition-colors"
      >
         <div className="relative w-[3.25rem] h-[3.25rem] shrink-0 overflow-hidden rounded-full border border-stone-200/80 bg-stone-50">
            <StoryImage
               src={article.imageUrl}
               alt={article.title}
               fill
               className="object-cover group-hover:scale-105 transition-transform duration-300"
               sizes="120px"
            />
         </div>
         <div className="min-w-0 flex-1">
            <span className="text-[10px] font-medium text-stone-500 tracking-wide block mb-0.5">
               {article.category?.categoryName}
            </span>
            <h3 className="text-[13px] font-inter font-semibold leading-snug text-stone-900 group-hover:underline line-clamp-2">
               {article.title}
            </h3>
            {article.content && (
               <p className="text-[10px] text-stone-500 line-clamp-1 mt-1 font-inter">{article.content}</p>
            )}
         </div>
      </Link>
   );
}

function InDepthSidebarEntry({ article, index }: { article: LandingArticle; index: number }) {
   switch (inDepthVariant(index)) {
      case "lead":
         return <InDepthLead article={article} />;
      case "splitBottom":
         return <InDepthSplitBottom article={article} />;
      case "excerptBar":
         return <InDepthExcerptBar article={article} />;
      case "overline":
         return <InDepthOverline article={article} />;
      case "ribbon":
         return <InDepthRibbon article={article} />;
      default:
         return <InDepthCompactRow article={article} />;
   }
}

/** Build up to four category preview groups (VoiceJeju category order). */
function getWireCategoryPreviewBlocks(
   reportArticles: LandingArticle[],
   excludeIds: Set<string>
): { name: string; previews: LandingArticle[] }[] {
   const voiceOrder = TENANT_CATEGORIES["voicejeju.com"] ?? [];
   const pool = reportArticles.filter((a) => !excludeIds.has(a.id));
   const byName = new Map<string, LandingArticle[]>();

   for (const a of pool) {
      const raw = a.category?.categoryName?.trim();
      const key = raw && raw.length > 0 ? raw : "기타";
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(a);
   }
   for (const list of byName.values()) {
      list.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
   }

   const blocks: { name: string; previews: LandingArticle[] }[] = [];
   const used = new Set<string>();

   for (const name of voiceOrder) {
      if (blocks.length >= 4) break;
      const list = byName.get(name);
      if (list && list.length > 0) {
         blocks.push({ name, previews: list.slice(0, 3) });
         used.add(name);
      }
   }
   for (const [name, list] of byName) {
      if (blocks.length >= 4) break;
      if (used.has(name)) continue;
      if (list.length > 0) {
         blocks.push({ name, previews: list.slice(0, 3) });
         used.add(name);
      }
   }

   return blocks;
}

/** Category mini-hubs below The Wire — four rotating layout modes per slot. */
function WireCategoryDeskSection({ blocks }: { blocks: { name: string; previews: LandingArticle[] }[] }) {
   if (blocks.length === 0) return null;

   return (
      <div className="mt-5 space-y-6 border-t-2 border-black pt-5">
         <div className="flex items-center gap-2">
            <div className="h-px min-w-[1rem] flex-1 bg-gray-300" />
            <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.35em] text-gray-600">
               Beyond the wire — by category
            </span>
            <div className="h-px min-w-[1rem] flex-1 bg-gray-300" />
         </div>
         <div className="space-y-6">
            {blocks.map(({ name, previews }, blockIdx) => {
               const v = blockIdx % 4;
               const browse = (
                  <Link
                     href={`/search?category=${encodeURIComponent(name)}`}
                     className="shrink-0 text-[10px] font-black uppercase tracking-[0.25em] text-gray-700 underline-offset-2 transition-colors hover:text-black hover:underline"
                  >
                     View all
                  </Link>
               );

               /* 0 — Rail: thick left rule, numbered rows + thumb */
               if (v === 0) {
                  return (
                     <section
                        key={name}
                        aria-labelledby={`wire-cat-${blockIdx}`}
                        className="border border-gray-200 border-l-4 border-l-black bg-white pl-1 shadow-sm"
                     >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
                           <h4
                              id={`wire-cat-${blockIdx}`}
                              className="min-w-0 font-voltaire text-sm font-normal tracking-tight text-black line-clamp-2"
                           >
                              {name}
                           </h4>
                           {browse}
                        </div>
                        <ul className="divide-y divide-gray-100">
                           {previews.map((a, i) => (
                              <li key={a.id}>
                                 <Link
                                    href={articleHref(a)}
                                    className="group flex items-start gap-3 py-2.5 px-3 transition-colors hover:bg-gray-50"
                                 >
                                    <div className="relative h-24 w-36 sm:h-32 sm:w-48 shrink-0 overflow-hidden bg-gray-100">
                                       <StoryImage
                                          src={a.imageUrl}
                                          alt={a.title}
                                          fill
                                          className="object-cover transition-transform group-hover:scale-105"
                                          sizes="(max-width: 640px) 288px, 384px"
                                       />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <p className="font-voltaire text-[14px] sm:text-[17px] leading-snug text-gray-900 group-hover:underline line-clamp-2 font-bold mb-1.5">
                                          {a.title}
                                       </p>
                                       {a.content && (
                                          <p className="text-[11px] sm:text-[13px] text-gray-600 line-clamp-4 leading-relaxed font-medium">
                                             {a.content}
                                          </p>
                                       )}
                                    </div>
                                 </Link>
                              </li>
                           ))}
                        </ul>
                     </section>
                  );
               }

               /* 1 — Mosaic: 3-up image tiles + captions */
               if (v === 1) {
                  return (
                     <section
                        key={name}
                        aria-labelledby={`wire-cat-${blockIdx}`}
                        className="overflow-hidden rounded-md border border-gray-300 bg-stone-50/80 p-3"
                     >
                        <div className="mb-3 flex items-end justify-between gap-2">
                           <h4
                              id={`wire-cat-${blockIdx}`}
                              className="max-w-[85%] border-b-2 border-stone-800 pb-1 font-inter text-[11px] font-bold uppercase tracking-[0.12em] text-stone-800"
                           >
                              {name}
                           </h4>
                           {browse}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           {previews.map((a) => (
                              <Link key={a.id} href={articleHref(a)} className="group min-w-0">
                                 <div className="relative mb-1.5 aspect-square overflow-hidden rounded-sm bg-stone-200 ring-1 ring-stone-300/80">
                                    <StoryImage
                                       src={a.imageUrl}
                                       alt={a.title}
                                       fill
                                       className="object-cover transition-transform group-hover:scale-105"
                                       sizes="(max-width: 768px) 30vw, 240px"
                                    />
                                 </div>
                                 <p className="line-clamp-2 text-[10px] font-medium leading-snug text-stone-900 group-hover:underline">
                                    {a.title}
                                 </p>
                              </Link>
                           ))}
                        </div>
                     </section>
                  );
               }

               /* 2 — Ledger: text-first, no images */
               if (v === 2) {
                  return (
                     <section
                        key={name}
                        aria-labelledby={`wire-cat-${blockIdx}`}
                        className="bg-black px-3 py-3 text-white"
                     >
                        <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/25 pb-2">
                           <h4 id={`wire-cat-${blockIdx}`} className="font-voltaire text-xs font-normal tracking-[0.2em]">
                              {name}
                           </h4>
                           <Link
                              href={`/search?category=${encodeURIComponent(name)}`}
                              className="text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-white"
                           >
                              View all
                           </Link>
                        </div>
                        <ul className="space-y-1">
                           {previews.map((a) => (
                              <li key={a.id}>
                                 <Link
                                    href={articleHref(a)}
                                    className="group flex gap-2 border-l-2 border-white/30 py-1.5 pl-2 transition-colors hover:border-white"
                                 >
                                    <span className="text-white/40" aria-hidden>
                                       →
                                    </span>
                                    <span className="text-[11px] font-medium leading-snug text-white/95 group-hover:underline line-clamp-2">
                                       {a.title}
                                    </span>
                                 </Link>
                              </li>
                           ))}
                        </ul>
                     </section>
                  );
               }

               /* 3 — Feature + stack: lead wide image, rest compact */
               const [leadA, ...rest] = previews;
               return (
                  <section
                     key={name}
                     aria-labelledby={`wire-cat-${blockIdx}`}
                     className="border-2 border-black bg-white"
                  >
                     <div className="flex items-center justify-between gap-2 bg-black px-3 py-2 text-white">
                        <h4 id={`wire-cat-${blockIdx}`} className="min-w-0 font-voltaire text-xs font-normal tracking-wide">
                           {name}
                        </h4>
                        {browse}
                     </div>
                     {leadA && (
                        <Link href={articleHref(leadA)} className="group block border-b border-gray-200">
                           <div className="relative aspect-[2.4/1] w-full bg-gray-100 overflow-hidden">
                              <StoryImage
                                 src={leadA.imageUrl}
                                 alt={leadA.title}
                                 fill
                                 className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                 sizes="(max-width: 1280px) 30vw, 720px"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <p className="absolute bottom-2 left-2 right-2 font-voltaire text-sm leading-tight text-white drop-shadow line-clamp-2">
                                 {leadA.title}
                              </p>
                           </div>
                        </Link>
                     )}
                     {rest.length > 0 && (
                        <ul className="divide-y divide-gray-100 p-2">
                           {rest.map((a) => (
                              <li key={a.id}>
                                 <Link
                                    href={articleHref(a)}
                                    className="group flex items-center gap-2 py-2 transition-colors hover:bg-gray-50"
                                 >
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200">
                                       <StoryImage
                                          src={a.imageUrl}
                                          alt={a.title}
                                          fill
                                          className="object-cover"
                                          sizes="80px"
                                       />
                                    </div>
                                    <span className="min-w-0 flex-1 text-[11px] font-voltaire leading-snug text-gray-800 group-hover:underline line-clamp-2">
                                       {a.title}
                                    </span>
                                 </Link>
                              </li>
                           ))}
                        </ul>
                     )}
                  </section>
               );
            })}
         </div>
      </div>
   );
}

/** Report desk: portal-style variety (clusters, grid, strip) — VoiceJeju chrome, not Naver. */
function ReportDeskCluster({
   lead,
   subs,
   variant = "primary",
}: {
   lead: LandingArticle;
   subs: LandingArticle[];
   variant?: "primary" | "secondary";
}) {
   return (
      <section className="py-2 bg-white">
         <Link
            href={articleHref(lead)}
            className="block group mb-3 pb-3 border-b border-gray-100"
         >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded border border-gray-100 bg-gray-50 mb-3">
               <StoryImage
                  src={lead.imageUrl}
                  alt={lead.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 720px"
               />
            </div>
            <div className="min-w-0">
               <span className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500 block mb-1">
                  {lead.category?.categoryName}
               </span>
               <h3 className="text-[17px] sm:text-lg font-voltaire leading-snug text-gray-900 group-hover:underline line-clamp-3">
                  {lead.title}
               </h3>
               {lead.content && (
                  <p className="mt-2 text-[12px] sm:text-[13px] font-normal leading-relaxed text-gray-600 line-clamp-3">
                     {lead.content}
                  </p>
               )}
            </div>
         </Link>

         {subs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
               <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                     {variant === "primary" ? "More from this desk" : "More picks from this desk"}
                  </span>
               </div>

               <ul
                  className={cn(
                     variant === "primary"
                        ? "flex flex-col"
                        : "grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2"
                  )}
               >
                  {subs.slice(0, 4).map((a, idx) => (
                     <li key={a.id}>
                        {variant === "primary" ? (
                           <Link
                              href={articleHref(a)}
                              className="group flex items-start gap-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                           >
                              <div className="relative h-20 w-32 sm:h-24 sm:w-36 shrink-0 overflow-hidden rounded bg-gray-50 border border-gray-100">
                                 <StoryImage
                                    src={a.imageUrl}
                                    alt={a.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 768px) 128px, 144px"
                                 />
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                 {a.category?.categoryName && (
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                                       {a.category.categoryName}
                                    </span>
                                 )}
                                 <h4 className="font-voltaire text-[14px] sm:text-[15px] font-normal leading-snug text-gray-900 group-hover:underline line-clamp-2">
                                    {a.title}
                                 </h4>
                                 {a.content && (
                                    <p className="mt-1 line-clamp-2 text-[11px] sm:text-[12px] font-normal leading-relaxed text-gray-500">
                                       {a.content}
                                    </p>
                                 )}
                              </div>
                           </Link>
                        ) : (
                           <Link
                              href={articleHref(a)}
                              className="group block py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                           >
                              <div className="mb-1 flex items-center gap-1.5 min-w-0">
                                 <span className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500 truncate">
                                    {a.category?.categoryName ?? "채널"}
                                 </span>
                                 <span className="text-[10px] text-gray-400 shrink-0">
                                    {new Date(a.createdAt).toLocaleDateString("ko-KR", {
                                       month: "2-digit",
                                       day: "2-digit",
                                    })}
                                 </span>
                              </div>

                              <div className="flex items-start gap-4">
                                 <div className="min-w-0 flex-1">
                                    <h4 className="text-[14px] sm:text-[15px] font-voltaire leading-snug text-gray-900 group-hover:underline line-clamp-2">
                                       {a.title}
                                    </h4>
                                    {a.content?.trim() && (
                                       <p className="mt-1 text-[11px] leading-relaxed text-gray-500 line-clamp-2">
                                          {a.content}
                                       </p>
                                    )}
                                 </div>
                                 <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded bg-gray-50 border border-gray-100">
                                    <StoryImage
                                       src={a.imageUrl}
                                       alt={a.title}
                                       fill
                                       className="object-cover transition-transform duration-300 group-hover:scale-105"
                                       sizes="160px"
                                    />
                                 </div>
                              </div>
                           </Link>
                        )}
                     </li>
                  ))}
               </ul>
            </div>
         )}
      </section>
   );
}

function ReportDeskGrid({ items }: { items: LandingArticle[] }) {
   if (items.length === 0) return null;
   return (
      <section className="py-4 bg-white">
         <div className="grid grid-cols-2 gap-3">
            {items.map((a) => (
               <Link key={a.id} href={articleHref(a)} className="group min-w-0 block">
                  <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded bg-gray-50 border border-gray-100">
                     <StoryImage
                        src={a.imageUrl}
                        alt={a.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 45vw, 300px"
                     />
                  </div>
                  <h3 className="text-[12px] sm:text-[13px] font-voltaire leading-snug text-gray-900 group-hover:underline line-clamp-2">
                     {a.title}
                  </h3>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 line-clamp-1">
                     {a.category?.categoryName}
                  </span>
               </Link>
            ))}
         </div>
      </section>
   );
}

function ReportDeskStrip({ items }: { items: LandingArticle[] }) {
   if (items.length === 0) return null;
   return (
      <section className="py-4 bg-white">
         <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin] snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]">
            {items.map((a) => (
               <Link
                  key={a.id}
                  href={articleHref(a)}
                  className="group snap-start w-[42%] max-w-[11rem] shrink-0 sm:w-[31%] sm:max-w-[10.5rem]"
               >
                  <div className="relative mb-2 aspect-[4/5] overflow-hidden rounded bg-gray-50 border border-gray-100">
                     <StoryImage
                        src={a.imageUrl}
                        alt={a.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="160px"
                     />
                  </div>
                  <h3 className="text-[11px] sm:text-[12px] font-voltaire leading-snug text-gray-900 group-hover:underline line-clamp-2">
                     {a.title}
                  </h3>
                  {a.content?.trim() && (
                     <p className="mt-1 text-[10px] leading-snug text-gray-600 line-clamp-2">
                        {a.content}
                     </p>
                  )}
               </Link>
            ))}
         </div>
      </section>
   );
}

function ReportDeskWide({ article }: { article: LandingArticle }) {
   return (
      <section className="py-4 bg-white">
         <Link href={articleHref(article)} className="group block">
            <div className="relative aspect-[2.1/1] w-full bg-gray-50 overflow-hidden rounded border border-gray-100">
               <StoryImage
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 768px"
               />
               <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
               <span className="absolute bottom-2 left-2 text-[10px] font-black uppercase tracking-[0.3em] text-white drop-shadow">
                  {article.category?.categoryName}
               </span>
            </div>
            <div className="py-3 px-0">
               <h3 className="text-lg font-voltaire leading-tight text-gray-900 group-hover:underline line-clamp-2 sm:text-xl">
                  {article.title}
               </h3>
               {article.content && (
                  <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-gray-600">
                     {article.content}
                  </p>
               )}
            </div>
         </Link>
      </section>
   );
}

function ReportDeskTextRun({ items }: { items: LandingArticle[] }) {
   if (items.length === 0) return null;
   return (
      <section className="py-2 bg-white">
         <ul className="divide-y divide-gray-100">
            {items.map((a) => (
               <li key={a.id}>
                  <Link
                     href={articleHref(a)}
                     className="block px-0 py-2.5 text-[12px] font-voltaire leading-snug text-gray-800 hover:bg-gray-50 line-clamp-2"
                  >
                     {a.title}
                  </Link>
               </li>
            ))}
         </ul>
      </section>
   );
}

function ReportDeskFeed({ articles }: { articles: LandingArticle[] }) {
   const blocks: ReactNode[] = [];
   let i = 0;
   let seg = 0;
   const n = articles.length;
   let clusterIndex = 0;

   const pushCluster = (leadIdx: number) => {
      const lead = articles[leadIdx];
      if (!lead) return 0;
      const maxSubs = 4;
      const avail = n - leadIdx - 1;
      const subCount = Math.min(maxSubs, Math.max(0, avail));
      const subs = articles.slice(leadIdx + 1, leadIdx + 1 + subCount);
      const variant = clusterIndex === 0 ? "primary" : "secondary";
      clusterIndex += 1;
      blocks.push(
         <ReportDeskCluster
            key={`rd-cluster-${lead.id}-${leadIdx}`}
            lead={lead}
            subs={subs}
            variant={variant}
         />
      );
      return 1 + subCount;
   };

   while (i < n) {
      const rem = n - i;
      const kind = seg % 6;

      if (kind === 0 || kind === 3) {
         const step = pushCluster(i);
         if (step > 0) {
            i += step;
            seg++;
            continue;
         }
      }

      if (kind === 1) {
         const take = rem >= 4 ? 4 : rem >= 2 ? rem : 0;
         if (take >= 2) {
            blocks.push(
               <ReportDeskGrid key={`rd-grid-${articles[i].id}-${i}`} items={articles.slice(i, i + take)} />
            );
            i += take;
            seg++;
            continue;
         }
      }

      if (kind === 2) {
         const take = Math.min(8, rem);
         // Keep at least 2 items for layout, but allow more than 3 so the strip
         // becomes a real horizontal carousel.
         if (take >= 2) {
            blocks.push(
               <ReportDeskStrip key={`rd-strip-${articles[i].id}-${i}`} items={articles.slice(i, i + take)} />
            );
            i += take;
            seg++;
            continue;
         }
      }

      if (kind === 4) {
         blocks.push(<ReportDeskWide key={`rd-wide-${articles[i].id}-${i}`} article={articles[i]} />);
         i += 1;
         seg++;
         continue;
      }

      if (kind === 5) {
         const take = Math.min(8, rem);
         if (take >= 2) {
            blocks.push(
               <ReportDeskTextRun key={`rd-run-${articles[i].id}-${i}`} items={articles.slice(i, i + take)} />
            );
            i += take;
            seg++;
            continue;
         }
      }

      if (rem >= 1) {
         const step = pushCluster(i);
         if (step > 0) {
            i += step;
            seg++;
            continue;
         }
         blocks.push(<ReportDeskWide key={`rd-fallback-${articles[i].id}-${i}`} article={articles[i]} />);
         i += 1;
         seg++;
      } else {
         break;
      }
   }

   return <div className="space-y-5">{blocks}</div>;
}

/** Seeded shuffle — same order on server and client (no hydration drift). */
function shuffleArchiveSeeded<T>(items: T[], seedStr: string): T[] {
   const a = [...items];
   let seed = 2166136261;
   for (let i = 0; i < seedStr.length; i++) {
      seed ^= seedStr.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
   }
   const next = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
   };
   for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
   }
   return a;
}

/** Full-width horizontal strip: all articles not shown above, shuffled (seeded). */
function RemainingStoriesArchive({ articles }: { articles: LandingArticle[] }) {
   const shuffled = useMemo(() => {
      if (articles.length === 0) return [];
      const seed = articles
         .map((a) => a.id)
         .sort()
         .join("|");
      return shuffleArchiveSeeded(articles, `voicejeju-archive|${seed}`).slice(0, 20);
   }, [articles]);

   if (shuffled.length === 0) return null;

   return (
      <div className="w-full overflow-hidden">
         <section className="mt-6 w-full border-t-2 border-black pt-5" aria-labelledby="archive-wide-heading">
         <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <h2
                  id="archive-wide-heading"
                  className="text-[11px] font-black uppercase tracking-[0.45em] text-black"
               >
                  Archive shuffle
               </h2>
               <p className="mt-1 max-w-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  Wide cards — every story not used above, in mixed order
               </p>
            </div>
            <Link
               href="/search"
               className="shrink-0 self-start border border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-black transition-colors hover:bg-black hover:text-white sm:self-auto"
            >
               Full index →
            </Link>
         </div>
         <div className="relative -mx-4 w-[calc(100%+2rem)] max-w-none sm:-mx-6 sm:w-[calc(100%+3rem)] lg:mx-0 lg:w-full">
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-3 pl-4 pr-4 pt-1 [scrollbar-width:thin] sm:pl-6 sm:pr-6 lg:pl-0 lg:pr-0">
               {shuffled.map((a) => (
                  <Link
                     key={a.id}
                     href={articleHref(a)}
                     className="group w-[min(88vw,22rem)] shrink-0 snap-start sm:w-[min(72vw,24rem)] md:w-[26rem]"
                  >
                     <div className="relative aspect-[2/1] w-full overflow-hidden border border-gray-200 bg-gray-100">
                        <StoryImage
                           src={a.imageUrl}
                           alt={a.title}
                           fill
                           className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                           sizes="(max-width: 640px) 88vw, 480px"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
                        {a.category?.categoryName && (
                           <span className="absolute bottom-2 left-2 text-[10px] font-black uppercase tracking-[0.25em] text-white drop-shadow">
                              {a.category.categoryName}
                           </span>
                        )}
                     </div>
                     <h3 className="mt-2.5 font-voltaire text-[15px] leading-snug text-gray-900 group-hover:underline line-clamp-3">
                        {a.title}
                     </h3>
                     {a.content && (
                        <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-gray-600">
                           {a.content}
                        </p>
                     )}
                  </Link>
               ))}
            </div>
         </div>
      </section>
   </div>
   );
}

export function VoiceJejuLanding(props: Props) {
   const { articles, banners } = props;

   const hasTopBanner = banners.top && banners.top.length > 0;

   const sortedArticles = [...articles].sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
         return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
   });

   const byDate = [...articles].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
   );

   const heroArticles = articles.slice(0, 5);
   const heroIds = new Set(heroArticles.map((a) => a.id));

   const wireHeadlines = byDate.filter((a) => !heroIds.has(a.id)).slice(0, 8);
   const wireIds = new Set(wireHeadlines.map((a) => a.id));
   const wireCategoryBlocks =
      wireHeadlines.length > 0 ? getWireCategoryPreviewBlocks(articles, wireIds) : [];
   const hasWireCategoryRow = wireCategoryBlocks.length > 0;

   const pool = sortedArticles.filter((a) => !heroIds.has(a.id) && !wireIds.has(a.id));

   const pickArticles = (count: number, excludeIds: Set<string>) => {
      const unique = pool.filter((a) => !excludeIds.has(a.id));
      if (unique.length >= count) return unique.slice(0, count);
      const remaining = count - unique.length;
      return [...unique, ...pool.filter((a) => excludeIds.has(a.id)).slice(0, remaining)];
   };

   const usedIds = new Set<string>([...heroIds, ...wireIds]);

   const trendingArticles = pickArticles(5, usedIds);
   trendingArticles.forEach((a) => usedIds.add(a.id));

   const sidebarPicks = pickArticles(6, usedIds);
   sidebarPicks.forEach((a) => usedIds.add(a.id));

   const leftSidebarArticles = pickArticles(10, usedIds);
   leftSidebarArticles.forEach((a) => usedIds.add(a.id));

   const uniqueLatest = pool.filter((a) => !usedIds.has(a.id));
   const latestStories = uniqueLatest.length > 0 ? uniqueLatest : pool;
   latestStories.forEach((a) => usedIds.add(a.id));

   const horizontalStrip = pickArticles(6, usedIds);
   horizontalStrip.forEach((a) => usedIds.add(a.id));

   const trendingProducts = articles.filter((a) => a.status === "blog").slice(0, 6);

   const homeDisplayedIds = new Set<string>([
      ...heroIds,
      ...wireIds,
      ...trendingArticles.map((a) => a.id),
      ...sidebarPicks.map((a) => a.id),
      ...leftSidebarArticles.map((a) => a.id),
      ...latestStories.map((a) => a.id),
      ...horizontalStrip.map((a) => a.id),
      ...trendingProducts.map((a) => a.id),
   ]);
   for (const block of wireCategoryBlocks) {
      for (const a of block.previews) {
         homeDisplayedIds.add(a.id);
      }
   }
   const remainingArticles = articles
      .filter((a) => !homeDisplayedIds.has(a.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

   const [page, setPage] = useState(0);
   const [heroFade, setHeroFade] = useState(false);
   const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
   const heroCount = heroArticles.length;
   const index = heroCount > 0 ? ((page % heroCount) + heroCount) % heroCount : 0;
   const heroArticle = heroArticles[index];

   const goToSlide = (targetIndex: number) => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setHeroFade(true);
      fadeTimer.current = setTimeout(() => {
         setPage(targetIndex);
         setHeroFade(false);
         fadeTimer.current = null;
      }, 150);
   };

   const paginate = (newDirection: number) => {
      goToSlide(((page + newDirection) % heroCount + heroCount) % heroCount);
   };

   useEffect(() => {
      if (heroCount <= 1) return;
      const id = setInterval(() => {
         if (fadeTimer.current) return;
         setHeroFade(true);
         fadeTimer.current = setTimeout(() => {
            setPage((p) => (p + 1) % heroCount);
            setHeroFade(false);
            fadeTimer.current = null;
         }, 150);
      }, 5000);
      return () => clearInterval(id);
   }, [heroCount]);

    const tenantConfig = ADSTERRA_CONFIG.voicejeju;
    const adKeys = tenantConfig.banners;
    const showSkyscrapers = adKeys["160x600"] && adKeys["160x600"].length > 0;
    const midFeedConfig = tenantConfig.midFeed;

    if (articles.length === 0) {
       return (
          <div className="min-h-[60vh] bg-white flex items-center justify-center px-4 font-inter">
             <div className="text-center">
                <p className="text-xl font-bold text-stone-900 mb-2">아직 기사가 없습니다.</p>
                <p className="text-sm text-stone-400 mt-1">Voice Jeju의 최신 소식을 곧 확인하세요.</p>
             </div>
          </div>
       );
    }

    return (
       <div
          className={cn(
             "bg-white min-h-screen font-inter selection:bg-black selection:text-white relative",
             hasTopBanner ? "pt-1" : "pt-2"
          )}
       >
          {/* Floating Left Gutter Skyscraper */}
          {showSkyscrapers && (
             <div className="hidden min-[1800px]:block absolute right-[50%] mr-[740px] top-32 bottom-32 w-[160px] z-30">
                <div className="sticky top-40">
                   <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
                </div>
             </div>
          )}

          {/* Floating Right Gutter Skyscraper */}
          {showSkyscrapers && (
             <div className="hidden min-[1800px]:block absolute left-[50%] ml-[740px] top-32 bottom-32 w-[160px] z-30">
                <div className="sticky top-40">
                   <AdsterraBanner bannerKey={adKeys["160x600"]} width={160} height={600} className="!my-0" />
                </div>
             </div>
          )}
         {hasTopBanner && (
            <div className="max-w-[1440px] mx-auto px-4 lg:px-8 mb-2">
               <AdBanner position="HOME_TOP" initialBanners={banners.top} />
            </div>
         )}

         {/* Adsterra Top Leaderboards */}
         <div className="max-w-[1440px] mx-auto px-4 lg:px-8 mb-2">
            {adKeys["728x90"] && (
               <div className="hidden sm:block">
                  <AdsterraBanner bannerKey={adKeys["728x90"]} width={728} height={90} />
               </div>
            )}
            {adKeys["320x50"] && (
               <div className="block sm:hidden">
                  <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} />
               </div>
            )}
         </div>

         <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-2 lg:py-4">
            <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-5 lg:gap-y-5">
               {/* Left — spans center + Wire (+ category row) on desktop; sticky until grid ends */}
               <aside
                  className={cn(
                     "relative hidden lg:col-span-3 lg:row-start-1 lg:block",
                     wireHeadlines.length > 0
                        ? hasWireCategoryRow
                           ? "lg:row-span-3"
                           : "lg:row-span-2"
                        : "lg:row-span-1"
                  )}
               >
                  <div className="sticky top-24 self-start border-t-4 border-black pt-3">
                     {banners.sideLTop && banners.sideLTop.length > 0 && (
                        <div className="mb-6">
                           <AdBanner position="SIDEBAR_L_TOP" initialBanners={banners.sideLTop} />
                        </div>
                     )}
                     <h2 className="text-[11px] font-black flex items-center w-full mb-3 uppercase tracking-[0.45em] text-black">
                        <div className="h-px flex-1 bg-black/10 mr-3" />
                        <span className="shrink-0">Latest</span>
                        <div className="h-px flex-1 bg-black/10 ml-3" />
                     </h2>
                     <div className="space-y-1">
                        {leftSidebarArticles.slice(0, 5).map((article, i) => (
                           <LatestSidebarEntry key={article.id} article={article} index={i} />
                        ))}
                        {banners.sideLMid && banners.sideLMid.length > 0 && (
                           <div className="py-2.5 border-b border-gray-100 flex justify-center">
                              <AdBanner position="SIDEBAR_L_MID" initialBanners={banners.sideLMid} />
                           </div>
                        )}
                        {leftSidebarArticles.slice(5).map((article, i) => (
                           <LatestSidebarEntry key={article.id} article={article} index={i + 5} />
                        ))}
                     </div>
                     {/* Adsterra Left Sidebar Banner */}
                     <div className="mt-6 flex justify-center border-t border-gray-100 pt-6">
                        <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} />
                     </div>
                  </div>
               </aside>

               {/* Center — row 1: spotlight + report desk */}
               <div className="min-w-0 border-x border-gray-100 px-2 sm:px-3 lg:col-span-6 lg:col-start-4 lg:row-start-1">
                  {/* Compact spotlight carousel */}
                  {heroArticle && (
                     <div className="mb-4 border-b-4 border-black pb-4">
                        <div className="space-y-3">
                           <div className="relative overflow-hidden bg-gray-50 group shrink-0 border border-gray-200">
                              <div
                                 className={cn(
                                    "absolute inset-0 transition-opacity duration-150",
                                    heroFade ? "opacity-0" : "opacity-100"
                                 )}
                              >
                                 <Link href={articleHref(heroArticle)} className="block h-full relative">
                                    <StoryImage
                                       src={heroArticle.imageUrl}
                                       alt={heroArticle.title}
                                       fill
                                       className="object-cover group-hover:scale-105 transition-transform duration-500"
                                       variant="hero"
                                       priority
                                       sizes="(max-width: 768px) 100vw, 720px"
                                    />
                                 </Link>
                              </div>
                              <div className="relative aspect-[16/9] w-full" />
                              {/* Dot indicators — bottom left */}
                              {heroCount > 1 && (
                                 <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
                                    {heroArticles.map((_, i) => (
                                       <button
                                          key={i}
                                          type="button"
                                          onClick={() => goToSlide(i)}
                                          aria-label={`Go to story ${i + 1}`}
                                          className={cn(
                                             "h-1.5 rounded-full transition-all duration-200",
                                             i === index
                                                ? "w-5 bg-white"
                                                : "w-1.5 bg-white/50 hover:bg-white/80"
                                          )}
                                       />
                                    ))}
                                 </div>
                              )}
                              {/* Prev / Next + counter — bottom right */}
                              <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
                                 {heroCount > 1 && (
                                    <span className="text-[10px] font-bold text-white/80 tabular-nums mr-1">
                                       {index + 1} / {heroCount}
                                    </span>
                                 )}
                                 <button
                                    type="button"
                                    onClick={() => paginate(-1)}
                                    className="w-8 h-8 bg-black text-white flex items-center justify-center opacity-90 hover:opacity-100"
                                    aria-label="Previous story"
                                 >
                                    <ChevronLeft className="w-4 h-4" />
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => paginate(1)}
                                    className="w-8 h-8 bg-black text-white flex items-center justify-center opacity-90 hover:opacity-100"
                                    aria-label="Next story"
                                 >
                                    <ChevronRight className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                           <div className="min-w-0">
                              <Link href={articleHref(heroArticle)} className="block group">
                                 <h2 className="text-xl sm:text-2xl lg:text-3xl font-voltaire font-normal leading-tight group-hover:underline underline-offset-4 decoration-1 tracking-tight">
                                    {heroArticle.title}
                                 </h2>
                              </Link>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Report desk — dynamic modules (cluster / grid / strip / wide / text run) */}
                  <div className="border-t border-gray-200 pt-3">
                     <div className="mb-4 border-b border-black pb-3">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.45em] text-black">
                           Report desk
                        </h2>
                     </div>
                     <ReportDeskFeed articles={latestStories} />
                  </div>

                  {/* Adsterra Mid-Feed Dynamic Banner */}
                  {midFeedConfig && (
                     <div className="flex justify-center w-full">
                        <AdsterraBanner bannerKey={midFeedConfig.key} width={midFeedConfig.width} height={midFeedConfig.height} className="!my-2" />
                     </div>
                  )}
               </div>

               {/* The Wire — row 2, redesigned as subscription-style card grid */}
               {wireHeadlines.length > 0 && (
                  <div className="min-w-0 border-x border-gray-100 px-2 sm:px-3 lg:col-span-6 lg:col-start-4 lg:row-start-2">
                     <section className="border-y border-gray-200 bg-gray-50/70">
                        <div className="px-2 py-2.5 sm:px-3 border-b border-gray-200">
                           <h2 className="text-[11px] font-black uppercase tracking-[0.45em] text-black">
                              More stories
                           </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-2 bg-white px-2 pb-2 pt-2 sm:grid-cols-2 sm:gap-3 sm:px-3 sm:pb-3 sm:pt-3">
                           {wireHeadlines.slice(0, 4).map((article) => (
                              <Link
                                 key={article.id}
                                 href={articleHref(article)}
                                 className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-sm transition-colors"
                              >
                                 <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
                                    <StoryImage
                                       src={article.imageUrl}
                                       alt={article.title}
                                       fill
                                       className="object-cover transition-transform duration-300 group-hover:scale-105"
                                       sizes="(max-width: 768px) 50vw, 360px"
                                    />
                                 </div>
                                 <div className="flex flex-1 flex-col px-2.5 py-2">
                                    {article.category?.categoryName && (
                                       <span className="mb-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                                          {article.category.categoryName}
                                       </span>
                                    )}
                                    <p className="min-w-0 font-voltaire text-[12px] leading-snug text-gray-900 group-hover:underline line-clamp-2">
                                       {article.title}
                                    </p>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </section>
                  </div>
               )}

               {wireHeadlines.length > 0 && hasWireCategoryRow && (
                  <div className="min-w-0 border-x border-gray-100 px-2 sm:px-3 lg:col-span-6 lg:col-start-4 lg:row-start-3">
                     <WireCategoryDeskSection blocks={wireCategoryBlocks} />
                  </div>
               )}

               {/* Right — spans center + Wire rows; sticky with left */}
               <aside
                  className={cn(
                     "relative lg:col-span-3 lg:col-start-10 lg:row-start-1",
                     wireHeadlines.length > 0
                        ? hasWireCategoryRow
                           ? "lg:row-span-3"
                           : "lg:row-span-2"
                        : "lg:row-span-1"
                  )}
               >
                  <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
                     <div className="border-t-4 border-black pt-3">
                        <h2 className="text-[11px] font-black flex items-center w-full mb-3 uppercase tracking-[0.45em] text-black">
                           <div className="h-px flex-1 bg-black/10 mr-3" />
                           <span className="shrink-0">Popular</span>
                           <div className="h-px flex-1 bg-black/10 ml-3" />
                        </h2>
                        <div className="space-y-1">
                           {trendingArticles.map((article, i) => (
                              <Link
                                 key={article.id}
                                 href={articleHref(article)}
                                 className="flex gap-2.5 group items-start py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50/90 transition-colors"
                              >
                                 <div className="relative h-24 w-36 shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                                    <StoryImage
                                       src={article.imageUrl}
                                       alt={article.title}
                                       fill
                                       className="object-cover group-hover:scale-105 transition-transform duration-300"
                                       sizes="280px"
                                    />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-1">
                                       {article.category?.categoryName}
                                    </span>
                                    <h3 className="text-[15px] font-voltaire leading-snug group-hover:underline line-clamp-2 font-medium">
                                       {article.title}
                                    </h3>
                                    {article.content && (
                                       <p className="text-[11px] text-gray-600 line-clamp-3 mt-1.5 leading-relaxed">
                                          {article.content}
                                       </p>
                                    )}
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </div>

                     {/* Adsterra Sidebar Banner */}
                     <div className="py-2 flex justify-center">
                        <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} />
                     </div>

                     {banners.sideRMid && banners.sideRMid.length > 0 && (
                        <div className="py-2">
                           <AdBanner position="SIDEBAR_R_MID" initialBanners={banners.sideRMid} />
                        </div>
                     )}

                     {sidebarPicks.length > 0 && (
                        <div className="border-t-4 border-stone-800 pt-3">
                           <div className="mb-3">
                              <p className="text-[10px] font-inter italic text-stone-500 mb-1">
                                 Essays and analysis
                              </p>
                              <h2 className="text-[11px] font-black flex items-center w-full uppercase tracking-[0.45em] text-stone-800">
                                 <div className="h-px flex-1 bg-stone-800/10 mr-3" />
                                 <span className="shrink-0">In depth</span>
                                 <div className="h-px flex-1 bg-stone-800/10 ml-3" />
                              </h2>
                           </div>
                           <div className="space-y-1">
                              {sidebarPicks.map((article, i) => (
                                 <InDepthSidebarEntry key={article.id} article={article} index={i} />
                              ))}
                           </div>
                        </div>
                     )}

                     {banners.sideRBtm && banners.sideRBtm.length > 0 && (
                        <div className="pt-2">
                           <AdBanner position="SIDEBAR_R_BTM" initialBanners={banners.sideRBtm} />
                        </div>
                     )}

                     <div className="pb-8">
                        <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
                     </div>
                  </div>
               </aside>
            </div>

            {/* Mobile: extra latest block when sidebar hidden */}
            <section className="lg:hidden mt-6 border-t-4 border-black pt-4">
               <h2 className="text-[11px] font-black uppercase tracking-[0.45em] mb-3">More headlines</h2>
               <div className="border border-gray-100 bg-white">
                  {leftSidebarArticles.slice(0, 10).map((article, i) => (
                     <LatestSidebarEntry key={`m-${article.id}`} article={article} index={i} />
                  ))}
               </div>
            </section>

            <RemainingStoriesArchive articles={remainingArticles} />

            {horizontalStrip.length > 0 && (
               <section className="mt-6 pt-4 border-t-2 border-black">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.45em] mb-3 text-black">
                     Across the island
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                     {horizontalStrip.map((article) => (
                        <Link
                           key={article.id}
                           href={articleHref(article)}
                           className="group block min-w-0"
                        >
                           <div className="relative w-full h-32 sm:h-36 overflow-hidden mb-2 bg-gray-50 border border-gray-100">
                              <StoryImage
                                 src={article.imageUrl}
                                 alt={article.title}
                                 fill
                                 className="object-cover group-hover:scale-105 transition-transform duration-300"
                                 sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px"
                              />
                           </div>
                           <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em] block mb-1 line-clamp-1">
                              {article.category?.categoryName}
                           </span>
                           <h3 className="text-[12px] sm:text-[13px] font-voltaire leading-tight group-hover:underline line-clamp-2">
                              {article.title}
                           </h3>
                        </Link>
                     ))}
                  </div>
               </section>
            )}

            {trendingProducts.length > 0 && (
               <section className="mt-6 pt-4 border-t-[6px] border-black">
                  <h2 className="text-[12px] font-black uppercase tracking-[0.5em] mb-4 text-center text-black">
                     VoiceJeju Journal
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                     {trendingProducts.map((article) => (
                        <Link
                           key={article.id}
                           href={articleHref(article)}
                           className="block group border border-gray-100 p-2 hover:border-black transition-colors min-w-0"
                        >
                           <div className="relative w-full aspect-[5/3] overflow-hidden mb-2 bg-gray-50">
                              <StoryImage
                                 src={article.imageUrl}
                                 alt={article.title}
                                 fill
                                 className="object-cover group-hover:scale-105 transition-transform duration-300"
                                 sizes="(max-width: 768px) 50vw, 240px"
                              />
                           </div>
                           <h3 className="text-[12px] sm:text-[13px] font-voltaire leading-snug group-hover:underline line-clamp-2 mb-1">
                              {article.title}
                           </h3>
                           <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.25em] group-hover:text-black">
                              Read
                           </span>
                        </Link>
                     ))}
                  </div>
               </section>
            )}

            {/* Adsterra Bottom Native Recommendations */}
            <div className="mt-4 border-t border-gray-200 pt-2">
               <AdsterraNativeBanner domain="voicejeju.com" />
            </div>
         </main>
      </div>
   );
}