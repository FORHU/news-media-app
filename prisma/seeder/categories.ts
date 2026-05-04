import type { PrismaClient } from "../../src/generated/prisma/client";

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
