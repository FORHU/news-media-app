import sharp from "sharp";
import { getValidImageSrc } from "@/lib/image-utils";
import {
  buildCrawledImageEditPrompt,
  buildDallE3FeaturedImagePrompt,
  editImageWithDallE2,
  fetchImageBytesFromUrl,
  generateImageWithDallE3,
  getOpenAiImageModel,
  isDallE3ImageModel,
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
  /** Story excerpt for DALL·E 3 text-only generations */
  storyExcerpt?: string;
};

/**
 * Featured hero images always go through OpenAI (`/v1/images/edits` or `/v1/images/generations`).
 * Never uses GENERATE_CONTENT_API `/chat`.
 */
export async function runOpenAiFeaturedImagePipeline(
  params: RunOpenAiFeaturedImageParams
): Promise<{ imageUrl: string | null; log: FeaturedImageGenerationLog }> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured for image regeneration.");
  }

  const { tenantId, articleTitle, userPrompt = "", storyExcerpt = "" } = params;
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
    pipelineLabel: "OpenAI featured image",
    outcome: "openai_error_fallback",
    detail: "OpenAI image step did not complete.",
  };

  if (isDallE3ImageModel(imageModel)) {
    log = {
      requested: true,
      openAiModel: imageModel,
      apiKind: "dall-e-3-generations",
      pipelineLabel: "OpenAI /v1/images/generations (DALL·E 3)",
      outcome: "openai_error_fallback",
      detail: "OpenAI image step did not complete.",
    };
    try {
      const genPrompt = buildDallE3FeaturedImagePrompt(
        articleTitle,
        customPrompt,
        storyExcerpt
      );
      const generatedBytes = await generateImageWithDallE3(genPrompt);
      const pngOut = await sharp(generatedBytes).png().toBuffer();
      resolvedImageUrl = await uploadPngBufferToSupabase(
        pngOut,
        tenantId,
        "openai-dalle3"
      );
      log.outcome = "openai_success";
      log.detail =
        "New hero image from OpenAI generations (headline, user prompt, story excerpt).";
    } catch (err) {
      console.error("[OpenAI Image] DALL·E 3 generation failed:", err);
      resolvedImageUrl = fallbackThumb ?? null;
      log.outcome = "openai_error_fallback";
      log.detail =
        err instanceof Error
          ? `OpenAI failed: ${err.message}. Used source thumbnail if available.`
          : "OpenAI image step failed. Used source thumbnail if available.";
    }
  } else if (canFetchSource && fallbackThumb) {
    log = {
      requested: true,
      openAiModel: imageModel,
      apiKind: "openai-image-edits",
      pipelineLabel: `OpenAI /v1/images/edits (${imageModel})`,
      outcome: "openai_error_fallback",
      detail: "OpenAI image step did not complete.",
    };
    try {
      const rawBytes = await fetchImageBytesFromUrl(fallbackThumb);
      const pngForEdit = await normalizeImageForOpenAiEdit(rawBytes);
      const editPrompt = buildCrawledImageEditPrompt(articleTitle, customPrompt);
      const editedBytes = await editImageWithDallE2(pngForEdit, editPrompt);
      const pngOut = await sharp(editedBytes).png().toBuffer();
      resolvedImageUrl = await uploadPngBufferToSupabase(
        pngOut,
        tenantId,
        "openai-edits"
      );
      log.outcome = "openai_success";
      log.detail =
        "New hero image from OpenAI edits (source thumbnail + revision prompt).";
    } catch (err) {
      console.error("[OpenAI Image] Image edit failed:", err);
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
      apiKind: "openai-image-edits",
      pipelineLabel: `OpenAI /v1/images/edits (${imageModel})`,
      outcome: "openai_skipped_no_source_image",
      detail:
        "Edit models need a downloadable http(s) source image. OpenAI was not called.",
    };
    resolvedImageUrl = fallbackThumb ?? null;
  }

  return { imageUrl: resolvedImageUrl, log };
}
