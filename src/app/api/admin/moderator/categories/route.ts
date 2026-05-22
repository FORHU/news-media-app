import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { CATEGORY_TRANSLATIONS, TENANT_CATEGORIES } from "@/config/categories";

// Reverse map: translated name → English name
const TRANSLATION_TO_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_TRANSLATIONS).map(([translated, english]) => [translated, english])
);

const JEJUTIME_ENGLISH_NAMES = TENANT_CATEGORIES["jejutime.com"];

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") return NextResponse.json([], { status: 401 });

    // Allow caller to request categories for a specific tenant (e.g. when editing a KO/ZH/JA article) (e.g. when editing a KO/ZH/JA article)
    // Fall back to resolving from request host (works for the create article form)
    const { searchParams } = new URL(request.url);
    const tenantId =
      searchParams.get("tenantId") ||
      (await resolveTenantIdFromRequest(request));

    if (!tenantId) return NextResponse.json([], { status: 400 });

    const dbCategories = await prisma.category.findMany({
      where: { tenantId, categoryName: { not: "N/A" } },
      select: { id: true, categoryName: true },
    });

    // For each DB category, resolve its English display name
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
