// Pure rules shared by the General Publish UI, API routes and repository.
// No imports on purpose: this file is unit-tested with `npm test` without a DB.

const NOTE_LABEL_RE =
  /^\s*(?:[-*•]\s*)?(?:\*\*|__)?\s*(seo title|meta title|meta description|target tags|target keywords|focus keywords?|url slug)\s*(?:\*\*|__)?\s*[:：]/i;
const RULE_RE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const LIST_ITEM_RE = /^\s*(?:[-*•]|\d+[.)])\s+/;

export type StrayNotes = {
  /** Labels found, e.g. ["SEO Title", "Meta Description"], in document order. */
  found: string[];
  /** The content with the trailing notes block removed. Equals the input when nothing was found or it isn't safe to cut. */
  cleaned: string;
  /** True when the notes form a clean trailing block that can be removed without touching article text. */
  canClean: boolean;
};

function titleCase(label: string): string {
  return label
    .toLowerCase()
    .split(" ")
    .map((w) => (w === "seo" ? "SEO" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Detects AI/editor leftovers pasted after the article body — a "---" rule and
 * labelled lines such as "SEO Title:", "Meta Description:", "Target Tags:".
 * Those would otherwise go live verbatim on every site.
 */
export function detectStrayNotes(content: string): StrayNotes {
  const lines = content.split(/\r?\n/);
  const labelIndexes: number[] = [];
  const found: string[] = [];

  lines.forEach((line, i) => {
    const m = NOTE_LABEL_RE.exec(line);
    if (!m) return;
    labelIndexes.push(i);
    const label = titleCase(m[1]);
    if (!found.includes(label)) found.push(label);
  });

  if (labelIndexes.length === 0) return { found: [], cleaned: content, canClean: false };

  // The block starts at the first label, or at the "---" rule right above it.
  let start = labelIndexes[0];
  let prev = start - 1;
  while (prev >= 0 && lines[prev].trim() === "") prev--;
  if (prev >= 0 && RULE_RE.test(lines[prev])) start = prev;

  // Safe to cut only when everything from `start` on is note-like. A label
  // sitting mid-article with real paragraphs after it is flagged, never cut.
  const tailIsNotes = lines
    .slice(start)
    .every((l) => l.trim() === "" || RULE_RE.test(l) || NOTE_LABEL_RE.test(l) || LIST_ITEM_RE.test(l));
  const canClean = tailIsNotes && start > 0 && lines.slice(0, start).some((l) => l.trim() !== "");

  return {
    found,
    cleaned: canClean ? lines.slice(0, start).join("\n").trimEnd() : content,
    canClean,
  };
}

/**
 * A published copy's slug is its indexed URL; changing it would 404 the old URL
 * (there is no slug history), so only copies that aren't live get re-slugged
 * when the title changes.
 */
export function shouldReslugCopy(newTitle: string | undefined, copy: { title: string; status: string }): boolean {
  return newTitle !== undefined && newTitle !== copy.title && copy.status !== "published";
}

export type PublishFailure = { tenantId: string; domain: string; error: string };

/**
 * Sites a broadcast failed to reach: every failure recorded in its audit
 * entries, minus tenants that have a copy now (a retry succeeded).
 */
export function deriveFailedTargets(
  entries: { failures?: PublishFailure[] | null }[],
  reachedTenantIds: Set<string>
): PublishFailure[] {
  const byTenant = new Map<string, PublishFailure>();
  for (const entry of entries) {
    for (const f of entry.failures ?? []) {
      if (reachedTenantIds.has(f.tenantId)) continue;
      byTenant.set(f.tenantId, f);
    }
  }
  return [...byTenant.values()];
}

/** Human message for the API/UI when a publish is blocked by stray notes. */
export function strayNotesMessage(found: string[]): string {
  return `Remove the leftover notes (${found.join(", ")}) from the article before publishing — they would appear on every live site.`;
}
