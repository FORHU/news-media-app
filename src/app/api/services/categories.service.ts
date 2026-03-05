import { categoriesRepository } from "@/app/api/repositories/categories.repository";

export const categoriesService = {
  async getCategories(): Promise<{ id: string; name: string }[]> {
    const categories = await categoriesRepository.getAllCategories();
    return categories.map((c) => ({ id: String(c.id), name: c.categoryName }));
  },
};
