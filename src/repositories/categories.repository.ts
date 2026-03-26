import { prisma } from "@/lib/db";

export const categoriesRepository = {
  getAllCategories() {
    return prisma.category.findMany({
      orderBy: { categoryName: "asc" },
    });
  },
};

