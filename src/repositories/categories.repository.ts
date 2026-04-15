import { prisma } from "@/lib/db";

export const categoriesRepository = {
  getAllCategories() {
    return prisma.category.findMany({
      orderBy: { categoryName: "asc" },
    });
  },
  async createOrGetCategoryByName(name: string) {
    const normalized = name.trim();
    const existing = await prisma.category.findFirst({
      where: {
        categoryName: {
          equals: normalized,
          mode: "insensitive",
        },
      },
    });
    if (existing) return existing;

    return prisma.category.create({
      data: { categoryName: normalized },
    });
  },
};

