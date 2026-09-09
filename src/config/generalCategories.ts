/**
 * Category list for the "General Publish" admin tab. Deliberately independent
 * of any single tenant's taxonomy (see getCoreCategories in ./categories) —
 * the target tenants for a broadcast don't share one taxonomy (legalhyper.com
 * uses its own legal-focused set), so this list is applied uniformly and
 * find-or-created per tenant at publish time.
 */
export const GENERAL_CATEGORIES = [
  "World",
  "Business",
  "Technology",
  "Science & Health",
  "Entertainment",
  "Sports",
  "Politics",
  "Lifestyle",
] as const;
