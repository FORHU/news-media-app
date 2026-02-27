import { categoriesRepository } from "@/app/api/repositories/categories.repository";

export const categoriesService = {
  async getCategories(): Promise<{ id: number; name: string }[]> {
    const categories = await categoriesRepository.getAllCategories();
    return categories.map((c) => ({ id: c.id, name: c.categoryName }));
  },
};
