/**
 * Static placeholder content for local/visual preview of LegalHyper (legalhyper.com)
 * landing page — no database or tenant row required. Swap for real DB-backed
 * articles once the tenant exists and the admin panel has real content.
 */

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
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const cat = (categoryName: string) => ({ category: { categoryName } });

const BYLINE_POOL = [
  "Eleanor Whitcombe",
  "Marcus Adeyemi",
  "Priya Raghunathan",
  "Helena Foss",
  "Daniel Okonjo",
  "Sofia Brandt",
  "Callum Reid",
  "Nora Vance",
  "James Anderson",
];

const RAW_MOCK_ARTICLES: MockArticle[] = [
  {
    id: "mock-1",
    title: "Legal AI Raises the Bar Ahead of Legal Geek London",
    content:
      "As the industry's leading legal AI conference approaches, our newsroom previews the product demos, partnerships, and courtroom-grade reasoning benchmarks set to headline this year's show.",
    imageUrl: null,
    createdAt: daysAgo(0),
    trendingScore: 98,
    status: "published",
    ...cat("Legal Geek Coverage"),
  },
  {
    id: "mock-2",
    title: "Inside the Model: How Legal AI Reasons Through Case Law",
    content:
      "A technical walkthrough of the retrieval and reasoning pipeline behind Legal AI's contract-review engine, and why grounding in primary sources matters more than raw model size.",
    imageUrl: null,
    createdAt: daysAgo(0),
    trendingScore: 91,
    status: "published",
    ...cat("Legal AI"),
  },
  {
    id: "mock-3",
    title: "UK Solicitors Regulation Authority Signals Openness to AI-Assisted Filings",
    content:
      "New guidance from the SRA suggests a lighter-touch approach to AI-assisted document preparation, provided firms maintain named-partner accountability for final work product.",
    imageUrl: null,
    createdAt: daysAgo(1),
    trendingScore: 84,
    status: "published",
    ...cat("Regulation & Policy"),
  },
  {
    id: "mock-4",
    title: "US District Court Sets New Standard for AI-Generated Evidence Summaries",
    content:
      "A closely watched ruling out of the Southern District of New York draws a line between AI-assisted summarization and inadmissible AI-authored argument.",
    imageUrl: null,
    createdAt: daysAgo(1),
    trendingScore: 76,
    status: "published",
    ...cat("Courts & Litigation"),
  },
  {
    id: "mock-5",
    title: "LegalTech Funding Rebounds: Q1 Sees Largest Series B Haul in Three Years",
    content:
      "Venture capital is flowing back into legal automation startups, with contract intelligence and AI-native litigation support leading the pack.",
    imageUrl: null,
    createdAt: daysAgo(2),
    trendingScore: 70,
    status: "published",
    ...cat("LegalTech News"),
  },
  {
    id: "mock-6",
    title: "Why In-House Counsel Are Quietly Becoming Legal AI's Biggest Buyers",
    content:
      "Corporate legal departments — not law firms — are driving the fastest adoption curve for AI review tools, according to new survey data shared exclusively with LegalWire.",
    imageUrl: null,
    createdAt: daysAgo(2),
    trendingScore: 65,
    status: "published",
    ...cat("Industry Analysis"),
  },
  {
    id: "mock-7",
    title: "The Chatbot That Cited Real Cases: A Look Under the Hood",
    content:
      "How citation-grounding architectures are closing the credibility gap that made early legal chatbots a courtroom liability.",
    imageUrl: null,
    createdAt: daysAgo(3),
    trendingScore: 60,
    status: "published",
    ...cat("Legal AI"),
  },
  {
    id: "mock-8",
    title: "EU AI Act's High-Risk Classification Puts Legal Tools Under New Scrutiny",
    content:
      "Legal-decision-support software may fall under the Act's high-risk category, triggering new documentation and human-oversight obligations for vendors selling into Europe.",
    imageUrl: null,
    createdAt: daysAgo(3),
    trendingScore: 58,
    status: "published",
    ...cat("Regulation & Policy"),
  },
  {
    id: "mock-9",
    title: "Legal Geek London: Five Sessions Worth Clearing Your Calendar For",
    content:
      "From judiciary panels on AI evidentiary standards to founder-led product demos, here's what the LegalWire desk is prioritizing on the show floor.",
    imageUrl: null,
    createdAt: daysAgo(4),
    trendingScore: 55,
    status: "published",
    ...cat("Legal Geek Coverage"),
  },
  {
    id: "mock-10",
    title: "Big Law's AI Dilemma: Bill Fewer Hours or Lose the Client",
    content:
      "As AI compresses the time needed for document review, firms are rethinking the billable hour itself — and some are moving to outcome-based pricing.",
    imageUrl: null,
    createdAt: daysAgo(4),
    trendingScore: 50,
    status: "published",
    ...cat("Industry Analysis"),
  },
  {
    id: "mock-11",
    title: "Appeals Court Upholds Sanctions Over Fabricated AI Citations",
    content:
      "The latest in a growing line of rulings penalizing attorneys who filed briefs containing AI-hallucinated case law without independent verification.",
    imageUrl: null,
    createdAt: daysAgo(5),
    trendingScore: 47,
    status: "published",
    ...cat("Courts & Litigation"),
  },
  {
    id: "mock-12",
    title: "Contract Review Startup Doubles Headcount After Enterprise Wins",
    content:
      "A wave of Fortune 500 legal department contracts is fueling rapid growth for one of the space's fastest-moving vendors.",
    imageUrl: null,
    createdAt: daysAgo(5),
    trendingScore: 44,
    status: "published",
    ...cat("LegalTech News"),
  },
  {
    id: "mock-13",
    title: "What Judges Actually Think About AI in Their Courtrooms",
    content:
      "LegalWire surveyed sitting judges across three jurisdictions on AI-assisted filings — the results are more nuanced than the headlines suggest.",
    imageUrl: null,
    createdAt: daysAgo(6),
    trendingScore: 41,
    status: "published",
    ...cat("Courts & Litigation"),
  },
  {
    id: "mock-14",
    title: "Legal AI Announces Integration Partnership Ahead of London Showcase",
    content:
      "The new integration lets firms pull grounded legal research directly into their existing document management workflow.",
    imageUrl: null,
    createdAt: daysAgo(6),
    trendingScore: 38,
    status: "published",
    ...cat("Legal AI"),
  },
  {
    id: "mock-15",
    title: "Regulators in Three Countries Open Coordinated Review of AI Legal Tools",
    content:
      "A joint statement signals the first steps toward cross-border standards for AI systems used in legal decision-making.",
    imageUrl: null,
    createdAt: daysAgo(7),
    trendingScore: 35,
    status: "published",
    ...cat("Regulation & Policy"),
  },
  {
    id: "mock-16",
    title: "The Associate's Dilemma: Learning the Law in an AI-First Firm",
    content:
      "Junior lawyers describe a training pipeline in flux as AI absorbs the grunt work that used to teach the fundamentals.",
    imageUrl: null,
    createdAt: daysAgo(7),
    trendingScore: 32,
    status: "published",
    ...cat("Industry Analysis"),
  },
  {
    id: "mock-17",
    title: "Legal Geek Coverage: Who's Exhibiting and What They're Announcing",
    content:
      "A running list of product launches, funding announcements, and partnership news from the exhibition floor.",
    imageUrl: null,
    createdAt: daysAgo(8),
    trendingScore: 29,
    status: "published",
    ...cat("Legal Geek Coverage"),
  },
  {
    id: "mock-18",
    title: "Benchmark Study: Legal AI Outperforms Junior Associates on Contract Redlines",
    content:
      "A blind-review study finds AI-assisted redlines flagged more risk clauses than first-year associates working unaided — with important caveats.",
    imageUrl: null,
    createdAt: daysAgo(8),
    trendingScore: 27,
    status: "published",
    ...cat("Legal AI"),
  },
  {
    id: "mock-19",
    title: "Litigation Funders Eye AI Case-Outcome Prediction Tools",
    content:
      "Third-party litigation funders are quietly testing predictive models to price case risk — a shift that could reshape how lawsuits get financed.",
    imageUrl: null,
    createdAt: daysAgo(9),
    trendingScore: 24,
    status: "published",
    ...cat("Industry Analysis"),
  },
  {
    id: "mock-20",
    title: "LegalTech Roundup: Ten Deals You Might Have Missed This Month",
    content:
      "From e-discovery automation to AI-native legal research, a quick digest of the month's smaller but notable transactions.",
    imageUrl: null,
    createdAt: daysAgo(9),
    trendingScore: 22,
    status: "published",
    ...cat("LegalTech News"),
  },
  {
    id: "mock-21",
    title: "Court Rules AI Vendor, Not Filing Attorney, Bears Liability for Faulty Output",
    content:
      "A first-of-its-kind ruling could reshape vendor contracts across the legal AI industry.",
    imageUrl: null,
    createdAt: daysAgo(10),
    trendingScore: 20,
    status: "published",
    ...cat("Courts & Litigation"),
  },
  {
    id: "mock-22",
    title: "Explainer: What 'Grounded' Actually Means in Legal AI Marketing",
    content:
      "Every vendor claims their model is grounded in real case law. Here's how to actually tell the difference.",
    imageUrl: null,
    createdAt: daysAgo(11),
    trendingScore: 18,
    status: "blog",
    ...cat("Legal AI"),
  },
  {
    id: "mock-23",
    title: "Five Charts on the State of Legal AI Adoption in 2026",
    content:
      "Adoption data across firm size, practice area, and geography — and where the growth curve is steepest.",
    imageUrl: null,
    createdAt: daysAgo(12),
    trendingScore: 16,
    status: "blog",
    ...cat("Industry Analysis"),
  },
  {
    id: "mock-24",
    title: "Legal Geek London Preview: The Regulation Panel to Watch",
    content:
      "A cross-jurisdictional panel of regulators and general counsel will tackle the thorniest open question in legal AI policy.",
    imageUrl: null,
    createdAt: daysAgo(13),
    trendingScore: 14,
    status: "blog",
    ...cat("Legal Geek Coverage"),
  },
  {
    id: "mock-25",
    title: "How One Mid-Size Firm Cut Discovery Time by 40% With AI",
    content:
      "A case study in incremental AI adoption, and the workflow changes that made the difference.",
    imageUrl: null,
    createdAt: daysAgo(14),
    trendingScore: 12,
    status: "blog",
    ...cat("LegalTech News"),
  },
];

/**
 * Hand-picked (not keyword-roulette) Unsplash photo IDs per desk — verified to resolve
 * before being wired in. Curated for consistent, premium editorial quality rather than
 * whatever a tag search happens to surface.
 */
const CATEGORY_PHOTO_IDS: Record<string, string[]> = {
  "Legal AI": [
    "1606857521015-7f9fcf423740",
    "1573164713988-8665fc963095",
    "1629904853716-f0bc54eea481",
    "1616386261012-8a328c89d5b6",
    "1646153114001-495dfb56506d",
    "1646154034833-d10291080448",
  ],
  "LegalTech News": [
    "1497366754035-f200968a6e72",
    "1505664194779-8beaceb93744",
    "1450101499163-c8848c66ca85",
    "1521587760476-6c12a4b040da",
    "1562564055-71e051d33c19",
    "1479142506502-19b3a3b7ff33",
  ],
  "Regulation & Policy": [
    "1523292562811-8fa7962a78c8",
    "1594581979864-36977b15d0dc",
    "1573181759662-1c146525b21f",
    "1624417963912-8532660d9de8",
    "1494476105528-620b211f568d",
    "1627397159237-d2acb7f500af",
  ],
  "Courts & Litigation": [
    "1596574027151-2ce81d85af3e",
    "1687289133469-b2a07a13b78b",
    "1568092806323-8ec13dfa9b92",
    "1706988056350-d112eabb6835",
  ],
  "Legal Geek Coverage": [
    "1540575467063-178a50c2df87",
    "1542744173-8e7e53415bb0",
    "1587825140708-dfaf72ae4b04",
    "1529070538774-1843cb3265df",
  ],
  "Industry Analysis": [
    "1517048676732-d65bc937f952",
    "1486406146926-c627a92ad1ab",
    "1606836591695-4d58a73eba1e",
  ],
};

const FALLBACK_PHOTO_IDS = CATEGORY_PHOTO_IDS["LegalTech News"];

function stockPhotoFor(categoryName: string | null | undefined, index: number): string {
  const pool = (categoryName && CATEGORY_PHOTO_IDS[categoryName]) || FALLBACK_PHOTO_IDS;
  const id = pool[index % pool.length];
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80&fm=jpg&fit=crop`;
}

const categoryPhotoCounters: Record<string, number> = {};

export const LEGALHYPER_MOCK_ARTICLES: MockArticle[] = RAW_MOCK_ARTICLES.map((a, i) => {
  const categoryKey = a.category?.categoryName ?? "__default";
  const photoIndex = categoryPhotoCounters[categoryKey] ?? 0;
  categoryPhotoCounters[categoryKey] = photoIndex + 1;

  return {
    ...a,
    author: a.author ?? BYLINE_POOL[i % BYLINE_POOL.length],
    imageUrl: a.imageUrl ?? stockPhotoFor(a.category?.categoryName, photoIndex),
  };
});

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
