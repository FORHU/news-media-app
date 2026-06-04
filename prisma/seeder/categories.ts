import type { PrismaClient } from "../../src/generated/prisma/client";
import { TENANT_CATEGORIES } from "../../src/config/categories";

export async function seedCategories(
  prisma: PrismaClient,
  tenantId: string,
  categoryNames: string[]
): Promise<Record<string, string>> {
  const categoryMap: Record<string, string> = {};
  for (const name of categoryNames) {
    let cat = await prisma.category.findFirst({
      where: { tenantId, categoryName: name },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: { tenantId, categoryName: name },
      });
    }
    categoryMap[name] = String(cat.id);
  }
  return categoryMap;
}

export async function seedTenantCategories(
  prisma: PrismaClient,
  domain: string,
  tenantId: string
): Promise<Record<string, string>> {
  const key = Object.keys(TENANT_CATEGORIES).find((k) => domain.includes(k)) ?? "newsicons.com";
  return seedCategories(prisma, tenantId, TENANT_CATEGORIES[key]);
}
