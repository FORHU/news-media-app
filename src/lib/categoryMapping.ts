import { prisma } from "@/lib/db";

/**
 * Maps foreign-language category names to English equivalents.
 * Keys are lowercase. Values must match EXACTLY the English categoryName in the DB.
 */
const FOREIGN_TO_ENGLISH: Record<string, string> = {
  // ── Korean (한국어) ──
  "사회": "World News",
  "금융": "Markets",
  "증권": "Markets",
  "부동산": "Markets",
  "자동차": "Automotive",
  "여행": "Travel",
  "환경": "Local Updates",
  "건강/의료": "Health & Wellness",
  "it/과학": "AI & Innovation",
  "라이프": "Health & Wellness",
  "세계": "World News",
  "지역": "Local Updates",
  "스타트업": "Startups",
  "자기계발": "Personal Development",

  // ── Japanese (日本語) & Chinese (中文) shared CJK ──
  "社会": "World News",
  "経済": "Markets",
  "政治": "World News",
  "国际": "World News",
  "文化": "Entertainment & Culture",
  "スポーツ": "Sports & Fitness",
  "科学": "AI & Innovation",
  "技術": "AI & Innovation",
  "健康": "Health & Wellness",
  "教育": "Education & Learning",
  "芸能": "Entertainment & Culture",
  "旅行": "Travel",
  "環境": "Local Updates",
  "ライフ": "Health & Wellness",
  "地域": "Local Updates",

  // ── Chinese-only (中文) ──
  "财经": "Markets",
  "科技": "AI & Innovation",
  "体育": "Sports & Fitness",
  "娱乐": "Entertainment & Culture",
  "旅游": "Travel",
};

/**
 * Given a raw article's categoryId, resolves the best matching English category.
 *
 * 1. Looks up the raw category name
 * 2. If it already matches an existing English category, returns its id as-is
 * 3. Otherwise, maps it via FOREIGN_TO_ENGLISH and looks up/returns the English category id
 * 4. Falls back to the original categoryId if no mapping is found
 */
export async function resolveEnglishCategoryId(
  rawCategoryId: string
): Promise<string> {
  // 1. Fetch the raw article's category
  const rawCategory = await prisma.category.findUnique({
    where: { id: rawCategoryId },
  });
  if (!rawCategory) {
    console.log("[CategoryMapping] No category found for id:", rawCategoryId);
    return rawCategoryId;
  }

  const rawName = rawCategory.categoryName.trim();
  console.log("[CategoryMapping] Raw category name:", JSON.stringify(rawName), "| id:", rawCategoryId);

  // 2. Get all existing categories to check for a direct English match
  const allCategories = await prisma.category.findMany();
  const englishCategories = new Map(
    allCategories.map((c) => [c.categoryName.toLowerCase(), c.id])
  );
  console.log("[CategoryMapping] All categories in DB:", allCategories.map(c => c.categoryName));

  // If the raw category name already matches an English category, keep it
  if (/^[a-zA-Z0-9\s&/]+$/.test(rawName)) {
    console.log("[CategoryMapping] Already English, keeping:", rawName);
    return rawCategoryId;
  }

  // 3. Look up the foreign name in our mapping
  const mappedEnglishName =
    FOREIGN_TO_ENGLISH[rawName] || FOREIGN_TO_ENGLISH[rawName.toLowerCase()];
  console.log("[CategoryMapping] Mapped to English:", mappedEnglishName || "NO MATCH");

  if (mappedEnglishName) {
    const englishCatId = englishCategories.get(mappedEnglishName.toLowerCase());
    if (englishCatId) {
      console.log("[CategoryMapping] Found existing English category:", mappedEnglishName, "| id:", englishCatId);
      return String(englishCatId);
    }

    // English category doesn't exist yet — create it
    console.log("[CategoryMapping] Creating new English category:", mappedEnglishName);
    const newCategory = await prisma.category.create({
      data: { categoryName: mappedEnglishName },
    });
    return String(newCategory.id);
  }

  // 4. No mapping found — fall back to original
  console.log("[CategoryMapping] Falling back to original categoryId:", rawCategoryId);
  return rawCategoryId;
}
