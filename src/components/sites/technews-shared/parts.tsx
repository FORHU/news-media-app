import type { ReactNode } from "react";
import type { TechNewsTheme } from "./theme";

/**
 * Presentational primitives shared by every technews domain. The variant switch
 * on `theme.wordmarkStyle` / `theme.labelStyle` is what keeps the six sites
 * recognisably different while the page skeleton stays identical.
 */

export function Wordmark({
  theme,
  className = "",
}: {
  theme: TechNewsTheme;
  className?: string;
}) {
  const { pre, main, accent, post } = theme.wordmark;

  switch (theme.wordmarkStyle) {
    case "chip":
      return (
        <span
          className={`inline-flex items-center font-serif font-black tracking-tight text-[var(--tn-ink)] ${className}`}
        >
          {pre && <span className="mr-1 text-[var(--tn-accent)]">{pre}</span>}
          {main}
          {accent && <span className="text-[var(--tn-accent)]">{accent}</span>}
          {post}
        </span>
      );

    case "prompt":
      return (
        <span
          className={`inline-flex items-baseline font-mono font-bold tracking-tight text-[var(--tn-ink)] ${className}`}
        >
          <span className="text-[var(--tn-accent)] mr-1">$</span>
          {main}
          {accent && (
            <span className="ml-0.5 inline-block w-[0.5ch] bg-[var(--tn-accent)] text-transparent animate-tn-caret select-none">
              {accent}
            </span>
          )}
        </span>
      );

    case "feature":
      return (
        <span
          className={`inline-block font-serif font-semibold tracking-[0.02em] text-[var(--tn-ink)] ${className}`}
        >
          {pre}
          {main}
          {accent && <span className="italic text-[var(--tn-accent)]">{accent}</span>}
          {post}
        </span>
      );

    case "hairline":
      return (
        <span
          className={`inline-flex items-center gap-2 font-serif font-light uppercase tracking-[0.42em] text-[var(--tn-ink)] ${className}`}
        >
          {main}
          <span className="h-[1.1em] w-px bg-[var(--tn-accent)]" aria-hidden />
          {accent && <span className="text-[var(--tn-accent)]">{accent}</span>}
        </span>
      );

    case "gate":
      return (
        <span
          className={`inline-flex items-stretch font-serif font-bold uppercase tracking-tight text-[var(--tn-ink)] ${className}`}
        >
          <span className="mr-1.5 w-[3px] bg-[var(--tn-accent)]" aria-hidden />
          {main}
          {accent && <span className="text-[var(--tn-accent)]">{accent}</span>}
          {post}
          <span className="ml-1.5 w-[3px] bg-[var(--tn-accent)]" aria-hidden />
        </span>
      );

    case "broadsheet":
    default:
      return (
        <span
          className={`inline-flex items-center gap-2 font-serif font-black tracking-tight text-[var(--tn-ink)] ${className}`}
        >
          <span aria-hidden className="flex items-end gap-[2px] pb-[0.18em]">
            <span className="w-[3px] h-[0.35em] bg-[var(--tn-accent)]" />
            <span className="w-[3px] h-[0.55em] bg-[var(--tn-accent)]" />
            <span className="w-[3px] h-[0.8em] bg-[var(--tn-accent)]" />
          </span>
          <span>
            {pre}
            {main}
            {accent}
          </span>
        </span>
      );
  }
}

export function SectionLabel({
  theme,
  children,
  className = "",
}: {
  theme: TechNewsTheme;
  children: ReactNode;
  className?: string;
}) {
  switch (theme.labelStyle) {
    case "monoArrow":
      return (
        <span
          className={`inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--tn-ink)] ${className}`}
        >
          <span className="text-[var(--tn-accent)]">▸</span>
          {children}
        </span>
      );

    case "prompt":
      return (
        <span
          className={`inline-flex items-center gap-2 font-mono text-[11px] font-bold lowercase tracking-[0.08em] text-[var(--tn-ink)] ${className}`}
        >
          <span className="text-[var(--tn-accent)]">{"»"}</span>
          {children}
        </span>
      );

    case "serifRule":
      return (
        <span
          className={`inline-flex flex-col gap-1.5 font-serif text-[15px] italic text-[var(--tn-ink)] ${className}`}
        >
          {children}
          <span className="h-px w-10 bg-[var(--tn-accent)]" aria-hidden />
        </span>
      );

    case "ruleOver":
      return (
        <span
          className={`inline-flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.34em] text-[var(--tn-ink)] ${className}`}
        >
          <span className="h-px w-full bg-[var(--tn-rule)]" aria-hidden />
          {children}
        </span>
      );

    case "solidBlock":
      return (
        <span
          className={`inline-block bg-[var(--tn-ink)] px-2.5 py-1 font-serif text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--tn-bg)] leading-none ${className}`}
        >
          {children}
        </span>
      );

    case "ticks":
    default:
      return (
        <span
          className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--tn-ink)] font-mono ${className}`}
        >
          <span aria-hidden className="flex items-end gap-[2px]">
            <span className="w-[2px] h-2 bg-[var(--tn-accent)]" />
            <span className="w-[2px] h-3 bg-[var(--tn-accent)]" />
            <span className="w-[2px] h-1.5 bg-[var(--tn-accent)]" />
          </span>
          {children}
        </span>
      );
  }
}

/** `▸ theverge.com` — link-provenance chip for the link-forward domains. */
export function SourceChip({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
  const host = source
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10.5px] font-medium text-[var(--tn-muted)] ${className}`}
    >
      <span className="text-[var(--tn-accent)]">▸</span>
      {host}
    </span>
  );
}
