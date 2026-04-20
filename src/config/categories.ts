export const HOME_CATEGORY_LABEL = "Latest News";

export const CORE_CATEGORIES = [
  "Politics",
  "Sports",
  "Technology",
  "Entertainment",
  "Business",
  "World",
  "Travel",
  "Science",
] as const;

const CATEGORY_ALIASES: Record<string, string> = {
  "world news": "world",
  worldnews: "world",
  international: "world",
  "international news": "world",
  sport: "sports",
  "sports fitness": "sports",
  "sports and fitness": "sports",
  "latest stories": "latest news",
  "latest news": "latest news",
};

const CATEGORY_VARIANTS: Record<string, string[]> = {
  world: ["World", "World News", "International", "International News"],
  sports: ["Sports", "Sport", "Sports & Fitness", "Sports and Fitness"],
  technology: ["Technology", "Tech", "Tech News"],
  entertainment: ["Entertainment", "Lifestyle", "Showbiz"],
  business: ["Business", "Economy", "Finance"],
  travel: ["Travel", "Tourism"],
  science: ["Science", "Research"],
  politics: ["Politics", "Political"],
};

export function normalizeCategoryKey(value: string | null | undefined): string {
  const base = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");

  return CATEGORY_ALIASES[base] ?? base;
}

export function getCategoryFilterVariants(
  value: string | null | undefined
): string[] {
  const key = normalizeCategoryKey(value);
  const source = (value ?? "").trim();
  const variants = CATEGORY_VARIANTS[key] ?? [];

  return Array.from(new Set([source, ...variants].filter(Boolean)));
}
