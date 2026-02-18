import type { PrismaClient } from "../../src/generated/prisma/client";

export async function seedCategories(
  prisma: PrismaClient,
  categoryNames: string[]
): Promise<Record<string, number>> {
  const categoryMap: Record<string, number> = {};
  for (const name of categoryNames) {
    let cat = await prisma.category.findFirst({ where: { categoryName: name } });
    if (!cat) {
      cat = await prisma.category.create({ data: { categoryName: name } });
    }
    categoryMap[name] = cat.id;
  }
  return categoryMap;
}
