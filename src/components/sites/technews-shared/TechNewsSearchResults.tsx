import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";
import { getTechNewsTheme, techNewsVars } from "./theme";
import { SectionLabel, SourceChip } from "./parts";
import { toFeedRows, excerpt } from "./feed";
import { FeedLink } from "./FeedLink";
import type { MediaStackArticle } from "@/lib/mediastack";

const MAX_ROWS = 60;

/**
 * Search results for the technews family: the tenant's own DB articles blended
 * with matching MediaStack rows (external rows link out, DB rows stay on-site).
 */
export function TechNewsSearchResults({
  domain,
  articles,
  mediastackArticles,
  searchQuery,
  categoryName,
}: {
  domain: string;
  articles: Parameters<typeof toFeedRows>[0];
  mediastackArticles: MediaStackArticle[];
  searchQuery?: string;
  categoryName?: string | null;
}) {
  const theme = getTechNewsTheme(domain);
  if (!theme) return null;

  // Keep image-less rows: TechOggi's feed is mostly text-only, and StoryImage
  // falls back to a placeholder.
  const rows = toFeedRows(articles, mediastackArticles).slice(0, MAX_ROWS);
  const heading = categoryName ?? (searchQuery ? `“${searchQuery}”` : "Latest");

  return (
    <div style={techNewsVars(theme)} className="text-[var(--tn-ink)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <SectionLabel theme={theme}>{heading}</SectionLabel>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)]">
            {rows.length} {rows.length === 1 ? "result" : "results"}
          </span>
          {(searchQuery || categoryName) && (
            <Link
              href="/search"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-accent)] hover:underline"
            >
              Clear
            </Link>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border-t-2 border-[var(--tn-ink)] py-16 text-center">
          <p className="text-xl font-medium text-[var(--tn-muted)]">No stories found.</p>
          <p className="mt-2 text-sm text-[var(--tn-muted)]">Try a different search term.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--tn-rule)] border-t border-[var(--tn-rule)]">
          {rows.map((row) => (
            <FeedLink
              key={row.id}
              row={row}
              className="group flex items-center gap-5 py-5 transition-colors hover:bg-[var(--tn-accent-soft)]/40"
            >
              <div
                className="relative h-[84px] w-[120px] shrink-0 overflow-hidden bg-[var(--tn-accent-soft)] sm:h-[100px] sm:w-[150px]"
                style={{ borderRadius: "var(--tn-radius)" }}
              >
                <StoryImage
                  src={row.imageUrl}
                  alt={row.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="150px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {row.external && theme.sourceChips ? (
                  <SourceChip source={row.source ?? ""} />
                ) : (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--tn-muted)]">
                    {row.external ? row.source : row.category?.categoryName ?? "News"}
                  </span>
                )}
                <h3 className="line-clamp-2 font-serif text-[17px] font-bold leading-snug text-[var(--tn-ink)] transition-colors group-hover:text-[var(--tn-accent)]">
                  {row.title}
                </h3>
                {row.content && (
                  <p className="line-clamp-2 text-[13px] leading-snug text-[var(--tn-muted)]">
                    {excerpt(row.content, 140)}
                  </p>
                )}
              </div>
            </FeedLink>
          ))}
        </div>
      )}
    </div>
  );
}
