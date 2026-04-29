import { categoriesRepository } from "@/repositories/categories.repository";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

export const categoriesService = {
  async getCategories(tenantId: string): Promise<{ id: string; name: string }[]> {
    const categories = await categoriesRepository.getAllCategories(tenantId);
    return categories
      .map((c) => ({ id: String(c.id), name: normalizeCategoryName(c.categoryName) }))
      .filter((c): c is { id: string; name: string } => Boolean(c.name));
  },
  async createCategory(
    name: string,
    tenantId: string
  ): Promise<{ id: string; name: string }> {
    const normalized = name.trim();
    if (!normalized) {
      throw new Error("Category name is required");
    }

    const existing = await categoriesRepository.findCategoryByName(normalized, tenantId);
    if (existing) {
      throw new Error(`Category "${normalized}" already exists.`);
    }

    const category = await categoriesRepository.createOrGetCategoryByName(normalized, tenantId);
    return { id: String(category.id), name: category.categoryName };
  },
};

