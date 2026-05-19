import sharp from "sharp";
import { getValidImageSrc } from "@/lib/image-utils";
import {
  buildCrawledImageEditPrompt,
  editImageWithGptImageMini,
  fetchImageBytesFromUrl,
  getOpenAiImageModel,
  normalizeImageForOpenAiEdit,
} from "@/lib/openaiImages";
import { uploadPngBufferToSupabase } from "@/lib/supabaseArticleImageUpload";
import type { FeaturedImageGenerationLog } from "@/lib/featuredImageGeneration";

export type RunOpenAiFeaturedImageParams = {
  tenantId: string;
  articleTitle: string;
  /** Revision notes or custom writing prompt for the image step */
  userPrompt?: string;
  sourceImageUrl?: string | null;
  /** Short article excerpt — thematic hints only; steers “same story, different look” away from the thumbnail alone */
  storyContext?: string;
};

/**
 * Featured hero images: source thumbnail + prompt → OpenAI `/v1/images/edits` (`gpt-image-1-mini`).
 * Never uses GENERATE_CONTENT_API `/chat`.
 */
export async function runOpenAiFeaturedImagePipeline(
  params: RunOpenAiFeaturedImageParams
): Promise<{ imageUrl: string | null; log: FeaturedImageGenerationLog }> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured for image regeneration.");
  }

  const { tenantId, articleTitle, userPrompt = "", storyContext = "" } = params;
  const customPrompt = userPrompt.trim();
  const fallbackThumb = getValidImageSrc(params.sourceImageUrl ?? null);
  const canFetchSource =
    !!fallbackThumb && /^https?:\/\//i.test(fallbackThumb);
  const imageModel = getOpenAiImageModel();

  let resolvedImageUrl: string | null = null;
  let log: FeaturedImageGenerationLog = {
    requested: true,
    openAiModel: imageModel,
    apiKind: "none",
    pipelineLabel: "OpenAI featured image (gpt-image-1-mini)",
    outcome: "openai_error_fallback",
    detail: "OpenAI image step did not complete.",
  };

  if (canFetchSource && fallbackThumb) {
    log = {
      requested: true,
      openAiModel: imageModel,
      apiKind: "gpt-image-mini-edits",
      pipelineLabel: `OpenAI /v1/images/edits (${imageModel})`,
      outcome: "openai_error_fallback",
      detail: "OpenAI image step did not complete.",
    };
    try {
      const rawBytes = await fetchImageBytesFromUrl(fallbackThumb);
      const pngForEdit = await normalizeImageForOpenAiEdit(rawBytes);
      const editPrompt = buildCrawledImageEditPrompt(
        articleTitle,
        customPrompt,
        storyContext.trim() || undefined
      );
      const editedBytes = await editImageWithGptImageMini(pngForEdit, editPrompt);
      const pngOut = await sharp(editedBytes).png().toBuffer();
      resolvedImageUrl = await uploadPngBufferToSupabase(
        pngOut,
        tenantId,
        "gpt-image-mini"
      );
      log.outcome = "openai_success";
      log.detail =
        "New hero image from gpt-image-1-mini edits (source thumbnail + revision prompt).";
    } catch (err) {
      console.error("[OpenAI Image] gpt-image-1-mini edit failed:", err);
      resolvedImageUrl = fallbackThumb ?? null;
      log.outcome = "openai_error_fallback";
      log.detail =
        err instanceof Error
          ? `OpenAI failed: ${err.message}. Used source thumbnail if available.`
          : "OpenAI image step failed. Used source thumbnail if available.";
    }
  } else {
    log = {
      requested: true,
      openAiModel: imageModel,
      apiKind: "gpt-image-mini-edits",
      pipelineLabel: `OpenAI /v1/images/edits (${imageModel})`,
      outcome: "openai_skipped_no_source_image",
      detail:
        "gpt-image-1-mini edits need a downloadable http(s) source image. OpenAI was not called.",
    };
    resolvedImageUrl = fallbackThumb ?? null;
  }

  return { imageUrl: resolvedImageUrl, log };
}
