import type { GeneralPublishBroadcast } from "./types";

export type AttentionItem = {
  id: string;
  title: string;
  failed: boolean;
  reasons: string[];
  /** 0 = failed on a site, 1 = missing new sites, 2 = draft. Lower sorts first. */
  rank: number;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The broadcasts an editor must act on, worst first. */
export function toAttentionItems(
  broadcasts: Pick<
    GeneralPublishBroadcast,
    "id" | "title" | "failedTargets" | "newTenantCount" | "publishedCount"
  >[]
): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const b of broadcasts) {
    const reasons: string[] = [];
    let rank = 3;

    if (b.failedTargets.length > 0) {
      const shown = b.failedTargets
        .slice(0, 2)
        .map((f) => f.domain)
        .join(", ");
      const more = b.failedTargets.length - 2;
      reasons.push(`Failed on ${shown}${more > 0 ? ` and ${more} more` : ""}`);
      rank = 0;
    }
    if (b.newTenantCount > 0) {
      reasons.push(`Not yet on ${plural(b.newTenantCount, "new site", "new sites")}`);
      rank = Math.min(rank, 1);
    }
    if (b.publishedCount === 0) {
      reasons.push("Draft, not live on any site");
      rank = Math.min(rank, 2);
    }

    if (reasons.length > 0) {
      items.push({ id: b.id, title: b.title, failed: b.failedTargets.length > 0, reasons, rank });
    }
  }
  // Stable sort keeps newest-first order within a rank.
  return items.sort((a, b) => a.rank - b.rank);
}
