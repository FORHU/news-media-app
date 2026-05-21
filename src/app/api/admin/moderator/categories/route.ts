import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CATEGORY_TRANSLATIONS, TENANT_CATEGORIES } from "@/config/categories";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

// Reverse map: translated name → English name
const TRANSLATION_TO_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_TRANSLATIONS).map(([translated, english]) => [translated, english])
);

const JEJUTIME_ENGLISH_NAMES = TENANT_CATEGORIES["jejutime.com"];

export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) return NextResponse.json([], { status: 401 });

    const dbCategories = await prisma.category.findMany({
      where: { tenantId, categoryName: { not: "N/A" } },
      select: { id: true, categoryName: true },
    });

    // For each DB category, resolve its English display name
    // If already English (jejutime), use as-is; otherwise translate via map
    const result = dbCategories
      .map((c) => {
        const englishName =
          TRANSLATION_TO_ENGLISH[c.categoryName] ??
          (JEJUTIME_ENGLISH_NAMES.find(
            (n) => n.toLowerCase() === c.categoryName.toLowerCase()
          ) || null);
        return englishName ? { id: c.id, name: englishName } : null;
      })
      .filter(Boolean)
      // Sort in the same order as jejutime config
      .sort((a, b) => {
        const ai = JEJUTIME_ENGLISH_NAMES.indexOf(a!.name);
        const bi = JEJUTIME_ENGLISH_NAMES.indexOf(b!.name);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[moderator/categories] Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
