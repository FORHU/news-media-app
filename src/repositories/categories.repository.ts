import { prisma } from "@/lib/db";

export const categoriesRepository = {
  getAllCategories(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId },
      orderBy: { categoryName: "asc" },
    });
  },
  findCategoryByName(name: string, tenantId: string) {
    return prisma.category.findFirst({
      where: {
        tenantId,
        categoryName: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });
  },
  async createOrGetCategoryByName(name: string, tenantId: string) {
    const normalized = name.trim();
    const existing = await prisma.category.findFirst({
      where: {
        tenantId,
        categoryName: {
          equals: normalized,
          mode: "insensitive",
        },
      },
    });
    if (existing) return existing;

    return prisma.category.create({
      data: { tenantId, categoryName: normalized },
    });
  },
};

