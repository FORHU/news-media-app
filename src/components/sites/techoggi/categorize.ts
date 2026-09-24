import { TECH_CATEGORIES_IT } from "@/config/categories";
import { fetchMediaStackNews } from "@/lib/mediastack";

/**
 * MediaStack tags every Italian-language result `category: "general"` — it
 * never breaks Italian tech news down by topic the way it does for English
 * sources. So for techoggi.com, the category nav/grouping can't come from
 * MediaStack's own tag; instead each fetched article is classified into the
 * existing TECH_CATEGORIES_IT taxonomy by keyword-matching its title/description.
 * This is a best-effort heuristic for bucketing a feed, not a precise classifier.
 */
const CATEGORY_KEYWORDS: Array<[string, string[]]> = [
  [
    "Intelligenza Artificiale",
    ["intelligenza artificiale", "ia generativa", "chatgpt", "machine learning", "llm", "gpt-", "openai", "algoritmo", "algoritmi", "rete neurale"],
  ],
  [
    "Sicurezza Informatica",
    ["sicurezza informatica", "cybersicurezza", "hacker", "attacco informatico", "violazione dati", "malware", "ransomware", "phishing", "vulnerabilità", "data breach"],
  ],
  [
    "Startup",
    ["startup", "finanziamento", "round di investimento", "venture capital", "fondatore", "unicorno", "incubatore"],
  ],
  [
    "Politiche Tecnologiche",
    ["normativa", "regolamento europeo", "antitrust", "privacy", "gdpr", "unione europea", "garante", "multa", "legge sulla", "disegno di legge"],
  ],
  [
    "Tecnologie Emergenti",
    ["robotica", "robot", "quantistico", "computer quantistico", "realtà virtuale", "realtà aumentata", "blockchain", "satellite", "drone", "spazio"],
  ],
  [
    "Cultura Digitale",
    ["social media", "instagram", "tiktok", "youtube", "streaming", "videogioco", "videogiochi", "gaming", "influencer", "metaverso"],
  ],
  [
    "Impresa e Infrastruttura Cloud",
    ["cloud", "data center", "server", "infrastruttura it", "azienda tecnologica", "saas", "enterprise"],
  ],
  [
    "Grandi Aziende Tech",
    ["apple", "google", "microsoft", "amazon", "meta", "tesla", "nvidia", "samsung electronics"],
  ],
  [
    "Tecnologia di Consumo",
    ["smartphone", "iphone", "samsung galaxy", "laptop", "tablet", "smartwatch", "auricolari", "gadget", "wearable", "fotocamera"],
  ],
  [
    "Sviluppo Software",
    ["software", "app", "applicazione", "programmazione", "sviluppatori", "codice sorgente", "github", "aggiornamento software"],
  ],
];

/** Returns the best-matching TECH_CATEGORIES_IT label, or null if nothing matched. */
export function classifyTechOggiCategory(title: string, content: string): string | null {
  const text = `${title} ${content}`.toLowerCase();
  let best: string | null = null;
  let bestScore = 0;
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const kw of keywords) if (text.includes(kw)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }
  return best;
}

/**
 * Fetches techoggi.com's live MediaStack feed and returns only the
 * TECH_CATEGORIES_IT labels that actually matched at least one fetched
 * article, in canonical order — so the nav never links to an empty category.
 * Falls back to the full taxonomy if classification matched nothing (e.g. the
 * feed is temporarily empty), so the nav is never blank either.
 */
export async function getTechOggiNavCategories(): Promise<string[]> {
  // Classification only reads title/description — it never needs an image —
  // so don't let a failed og:image scrape (common for these Italian sources)
  // silently remove an article before it even gets classified. Also exclude
  // zazoom.it (a generic aggregator that dominates unfiltered Italian
  // results — see page.tsx) to keep this in sync with the homepage's query.
  const articles = await fetchMediaStackNews({
    keywords: "tecnologia",
    languages: "it",
    limit: 100,
    sources: "-zazoom",
    requireImage: false,
    // Matches page.tsx's call exactly so Next's request memoization can
    // dedupe the two (layout + page both call this on every homepage load).
    microlinkLimit: 15,
  });
  const present = new Set<string>();
  for (const a of articles) {
    const category = classifyTechOggiCategory(a.title, a.description ?? "");
    if (category) present.add(category);
  }
  const ordered = TECH_CATEGORIES_IT.filter((c) => present.has(c));
  return ordered.length > 0 ? ordered : TECH_CATEGORIES_IT;
}
