export const HOME_CATEGORY_LABEL = "Latest News";

export const TENANT_CATEGORIES: Record<string, string[]> = {
  "jejutime.com": [
    "Jeju Today",
    "Travel & Tourism",
    "Food & Restaurants",
    "Shopping & Markets",
    "Stay & Accommodation",
    "Getting Around",
    "Events & Festivals",
    "Nature & Outdoors",
    "Visa & Entry Info",
    "Local Business & Living",
  ],
  "jejuqq.com": [
    "济州今日",
    "旅游资讯",
    "美食餐厅",
    "购物市场",
    "住宿信息",
    "交通出行",
    "活动节庆",
    "自然户外",
    "签证入境",
    "本地商业生活",
  ],
  "jejujapan.com": [
    "済州今日",
    "旅行情報",
    "グルメ情報",
    "ショッピング",
    "宿泊情報",
    "交通・移動",
    "イベント・祭り",
    "自然・アウトドア",
    "ビザ・入国情報",
    "ローカルビジネス・生活",
  ],
  "newsicons.com": [
    "Politics",
    "Sports",
    "Technology",
    "Entertainment",
    "Business",
    "World",
    "Travel",
    "Science",
  ],
  "skyblueprime.com": [
    "AI & Machine Learning",
    "Gadgets",
    "Software",
    "Cybersecurity",
    "Startups",
    "Hardware",
    "Cloud Computing",
    "Tech Policy",
  ],
  "voicejeju.com": [
    "제주 오늘",
    "여행 및 관광",
    "음식 및 맛집",
    "쇼핑 및 시장",
    "숙박 정보",
    "교통 및 이동",
    "이벤트 및 축제",
    "자연 및 아웃도어",
    "비자 및 입국 정보",
    "로컬 비즈니스 및 생활"
  ],
};

export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  // Korean (VoiceJeju)
  "제주 오늘": "Jeju Today",
  "여행 및 관광": "Travel & Tourism",
  "음식 및 맛집": "Food & Restaurants",
  "쇼핑 및 시장": "Shopping & Markets",
  "숙박 정보": "Stay & Accommodation",
  "교통 및 이동": "Getting Around",
  "이벤트 및 축제": "Events & Festivals",
  "자연 및 아웃도어": "Nature & Outdoors",
  "비자 및 입국 정보": "Visa & Entry Info",
  "로컬 비즈니스 및 생활": "Local Business & Living",
  
  // Chinese (JejuQQ)
  "济州今日": "Jeju Today",
  "旅游资讯": "Travel & Tourism",
  "美食餐厅": "Food & Restaurants",
  "购物市场": "Shopping & Markets",
  "住宿信息": "Stay & Accommodation",
  "交通出行": "Getting Around",
  "活动节庆": "Events & Festivals",
  "自然户外": "Nature & Outdoors",
  "签证入境": "Visa & Entry Info",
  "本地商业生活": "Local Business & Living",

  // Japanese (JejuJapan)
  "済州今日": "Jeju Today",
  "旅行情報": "Travel & Tourism",
  "グルメ情報": "Food & Restaurants",
  "ショッピング": "Shopping & Markets",
  "宿泊情報": "Stay & Accommodation",
  "交通・移動": "Getting Around",
  "イベント・祭り": "Events & Festivals",
  "自然・アウトドア": "Nature & Outdoors",
  "ビザ・入国情報": "Visa & Entry Info",
  "ローカルビジネス・生活": "Local Business & Living",
};

export function getCategoryLabel(categoryName: string): string {
  const translation = CATEGORY_TRANSLATIONS[categoryName];
  if (translation && translation !== categoryName) {
    return `${categoryName} (${translation})`;
  }
  return categoryName;
}

export function getCoreCategories(domain: string): string[] {
  // Normalize domain to check against keys
  const key = Object.keys(TENANT_CATEGORIES).find(k => domain.includes(k)) || "newsicons.com";
  return TENANT_CATEGORIES[key as keyof typeof TENANT_CATEGORIES];
}

// Keep legacy export for compatibility during transition
export const CORE_CATEGORIES = TENANT_CATEGORIES["newsicons.com"];

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
