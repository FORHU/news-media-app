export const NA_CATEGORY = "N/A";

export function normalizeCategoryName(name: string | null | undefined): string | null {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === NA_CATEGORY.toLowerCase()) return null;
  return trimmed;
}

export function isCategoryDisplayable(name: string | null | undefined): boolean {
  return normalizeCategoryName(name) !== null;
}

