import { categoriesRepository } from "@/repositories/categories.repository";

export const categoriesService = {
  async getCategories(): Promise<{ id: string; name: string }[]> {
    const categories = await categoriesRepository.getAllCategories();
    return categories.map((c) => ({ id: String(c.id), name: c.categoryName }));
  },
  async createCategory(name: string): Promise<{ id: string; name: string }> {
    const normalized = name.trim();
    if (!normalized) {
      throw new Error("Category name is required");
    }
    const category = await categoriesRepository.createOrGetCategoryByName(normalized);
    return { id: String(category.id), name: category.categoryName };
  },
};

