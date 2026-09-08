/**
 * LegalHyper (legalhyper.com) landing page content types + MediaStack adapter.
 * Article content is fetched live from the MediaStack API (see src/lib/mediastack.ts)
 * and mapped into this shape — the "Opinion & Analysis" section below is still
 * static placeholder copy since MediaStack has no opinion/analysis content.
 */

import type { MediaStackArticle } from "@/lib/mediastack";

export interface MockArticle {
  id: string;
  slug?: string | null;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  trendingScore?: number | null;
  status?: string | null;
  author?: string;
  category?: { categoryName?: string | null } | null;
  /** External source URL — when set, the article links out instead of to an internal page. */
  url?: string | null;
}

// MediaStack has no legal-specific taxonomy, so incoming articles are rotated
// across these desks to keep the "Featured Desks" section populated.
const LEGALHYPER_DESKS = [
  "Legal AI",
  "LegalTech News",
  "Regulation & Policy",
  "Courts & Litigation",
  "Legal Geek Coverage",
  "Industry Analysis",
];

// MediaStack's `keywords` param alone isn't strict enough to guarantee relevance —
// this re-checks title/description against actual legal/law terms before an article
// is allowed onto LegalHyper. Bare "legal" and "law"/"laws" are deliberately excluded:
// they're common generic adjectives ("legal age", "legal sex", "legal weed",
// "mother-in-law") with no connection to the legal industry, and let unrelated
// articles slip through. Only unambiguous legal-industry terms/phrases count.
const LEGAL_TERMS_RE =
  /\b(lawyer|lawyers|attorney|attorneys|litigation|litigator|litigators|lawsuit|lawsuits|courtroom|judge|judges|judicial|judiciary|legislation|legislature|legislative|legislator|legislators|regulator|regulators|regulatory|regulation|regulations|compliance|counsel|solicitor|solicitors|barrister|barristers|verdict|plaintiff|defendant|defendants|statute|statutes|paralegal|prosecutor|prosecutors|prosecution|indictment|acquittal|jurisprudence|legaltech|sue|sued|suing|law firm|law firms|law school|law schools|bar association|supreme court|appeals court|appellate court|class action|legal aid|legal action|legal battle|legal dispute|legal challenge|legal ruling|legal case|legal team|legal industry|legal profession|legal sector|legal department|legal counsel|legal fees|legal system|court ruling|court order)\b/i;

function isLegalRelevant(item: MediaStackArticle): boolean {
  const haystack = `${item.title} ${item.description ?? ""}`;
  return LEGAL_TERMS_RE.test(haystack);
}

export function mapMediaStackToLegalHyperArticles(items: MediaStackArticle[]): MockArticle[] {
  return items
    .filter((item) => !!item.image && isLegalRelevant(item))
    .map((item, i) => ({
      id: item.id,
      title: item.title,
      content: item.description,
      imageUrl: item.image,
      createdAt: item.publishedAt,
      trendingScore: Math.max(0, items.length - i),
      status: "published",
      author: item.source,
      category: { categoryName: LEGALHYPER_DESKS[i % LEGALHYPER_DESKS.length] },
      url: item.url,
    }));
}

export interface MockOpinion {
  id: string;
  title: string;
  dek: string;
  author: string;
  credential: string;
}

export const LEGALHYPER_MOCK_OPINIONS: MockOpinion[] = [
  {
    id: "op-1",
    title: "Grounded Reasoning Is the Only Legal AI Feature That Matters",
    dek: "Every other capability is negotiable. Citation fidelity to real, retrievable case law is not — and most vendors still fudge it.",
    author: "Prof. Alistair Venn",
    credential: "Chair of Legal Technology, Meridian University",
  },
  {
    id: "op-2",
    title: "The Billable Hour Won't Survive Contact With Competent AI",
    dek: "Firms clinging to hourly billing while selling AI-accelerated turnaround are pricing themselves out of their own efficiency gains.",
    author: "Dame Ruth Ellery",
    credential: "Former Managing Partner, Ellery & Cross",
  },
  {
    id: "op-3",
    title: "Regulators Are Asking the Wrong Question About Legal AI",
    dek: "The debate over whether AI should touch legal work is over. The one that matters now is who is accountable when it does.",
    author: "Dr. Nadia Kastellan",
    credential: "Senior Fellow, Institute for Legal Innovation",
  },
];
