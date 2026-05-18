/**
 * Returned with successful POST /api/admin/crawledArticles/aiGenerateContent
 * so admins can see which OpenAI image path ran.
 */
export type FeaturedImageGenerationLog = {
  requested: boolean;
  /** Model id from env (e.g. dall-e-3, gpt-image-1, dall-e-2). */
  openAiModel: string;
  /** Which API shape was used (or none). */
  apiKind: "dall-e-3-generations" | "openai-image-edits" | "none";
  /** Short human-readable pipeline name. */
  pipelineLabel: string;
  outcome:
    | "openai_success"
    | "openai_skipped_no_source_image"
    | "openai_error_fallback"
    | "not_requested";
  detail: string;
};

export function formatFeaturedImageGenerationLog(log: FeaturedImageGenerationLog): string {
  const outcomeWord =
    log.outcome === "openai_success"
      ? "Success"
      : log.outcome === "openai_error_fallback"
        ? "Fallback"
        : log.outcome === "openai_skipped_no_source_image"
          ? "Skipped"
          : "N/A";
  return `${log.pipelineLabel} · ${outcomeWord} (${log.openAiModel})`;
}
