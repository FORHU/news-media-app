/** RawTweet.generationMode values that use the social-commentary layout (embed + article). */
export function isTweetSocialCommentaryMode(
  mode: string | null | undefined
): boolean {
  return (
    mode === "commentary" ||
    mode === "commentary_support" ||
    mode === "commentary_oppose"
  );
}

/**
 * Remove legacy "--- ORIGINAL POST ---" pasted blocks (multiple formats).
 * Keeps the trailing `Reference: …` line at the bottom when present.
 */
export function stripOriginalPostBlock(content: string): string {
  const trimmed = content.trimEnd();

  let refSuffix = "";
  let body = trimmed;
  const refRe = /\n+(Reference:\s*https?:\/\/[^\s]+[^\n]*)$/im;
  const refMatch = refRe.exec(trimmed);
  if (refMatch) {
    refSuffix = refMatch[1].trim();
    body = trimmed.slice(0, refMatch.index!).trimEnd();
  }

  let b = body
    // Strict delimited block
    .replace(/\n*---\s*ORIGINAL POST\s*---[\s\S]*?---\s*END ORIGINAL POST\s*---\s*/gi, "\n")
    // `---` rule line + ORIGINAL POST --- then rest of duplicate (no END marker)
    .replace(/\n-{3,}\s*\n+ORIGINAL POST\s*-{3,}[\s\S]*/gi, "\n")
    // Same without leading `---` paragraph
    .replace(/\nORIGINAL POST\s*-{3,}[\s\S]*/gi, "\n");

  b = b.replace(/\n{3,}/g, "\n\n").trim();

  if (refSuffix) {
    return `${b}\n\n${refSuffix}`.trim();
  }
  return b;
}

/** Pull the trailing `Reference: …` line out for typography under the prose (social commentary tweets). */
export function splitReferenceLineFromContent(
  content: string,
  enabled: boolean
): { main: string; referenceLine: string | null } {
  if (!enabled) return { main: content, referenceLine: null };
  const trimmed = content.trimEnd();
  const m = /\n+(Reference:\s*[^\n]+)\s*$/im.exec(trimmed);
  if (!m) return { main: content, referenceLine: null };
  return {
    main: trimmed.slice(0, m.index!).trimEnd(),
    referenceLine: m[1].trim(),
  };
}
