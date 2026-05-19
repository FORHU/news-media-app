import sharp from "sharp";

const OPENAI_IMAGES_EDITS = "https://api.openai.com/v1/images/edits";
const OPENAI_IMAGES_GENERATIONS = "https://api.openai.com/v1/images/generations";
const MAX_SOURCE_DOWNLOAD_BYTES = 8 * 1024 * 1024;
/** Default landscape hero size (wider than square). Override with OPENAI_IMAGE_SIZE e.g. 1792x1024 */
const DEFAULT_OPENAI_IMAGE_SIZE = "1536x1024";

function getOpenAiImageSize(): string {
  const raw = process.env.OPENAI_IMAGE_SIZE?.trim();
  if (raw && /^\d+x\d+$/i.test(raw)) return raw.toLowerCase();
  return DEFAULT_OPENAI_IMAGE_SIZE;
}

function getOpenAiImageDimensions(): { width: number; height: number } {
  const [w, h] = getOpenAiImageSize().split("x").map(Number);
  return { width: w, height: h };
}
const MAX_EDIT_PROMPT_CHARS = 1200;
const DALLE3_MAX_PROMPT_CHARS = 4000;
/** Thematic excerpt only — long verbatim source text makes DALL·E mimic the crawled photo. */
const DALLE3_STORY_CONTEXT_MAX_CHARS = 900;

export class OpenAiImageError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly upstream?: unknown
  ) {
    super(message);
    this.name = "OpenAiImageError";
  }
}

export function buildCrawledImageEditPrompt(
  articleTitle: string,
  userWritingPrompt: string
): string {
  const title = articleTitle.trim().slice(0, 220);
  const extra = userWritingPrompt.trim().slice(0, 380);
  
  const base = [
    "Edit this reference into a sibling image: keep clear similarities in subject matter, mood, color palette, and scene type so it still reads as the same story beat.",
    "Display it in a unique way — different crop, camera height, depth, negative space, or asymmetry — so it is not a duplicate frame, but unmistakably related to the source.",
    "Match the reference medium (photo, graphic, product shot, architecture, landscape, crowd, interior, etc.). Do not switch to a different category.",
    "If the reference includes people, you may include people with different individuals and poses; if it has no people, do not add people, faces, or silhouettes.",
    "If the reference is typography or brand graphics, keep that graphic style but use a fresh layout and shapes — do not copy the same words, split-screen, or logo arrangement.",
    "Remove outlet watermarks, mastheads, and credit overlays. No caption text baked into the image.",
    title ? `Topic hint only — do not render as text: ${title}.` : "",
    extra ? `Editor notes: ${extra}.` : "",
    "Photorealistic or clean editorial graphic as appropriate to the source. Natural, varied lighting — avoid repeating the same cinematic filter on every output.",
  ]
    .filter(Boolean)
    .join(" ");

  return base.length > MAX_EDIT_PROMPT_CHARS
    ? base.slice(0, MAX_EDIT_PROMPT_CHARS)
    : base;
}

/**
 * Text-only prompt for DALL·E 3 (`/v1/images/generations`). Max 4000 characters per OpenAI.
 */
export function buildDallE3FeaturedImagePrompt(
  articleTitle: string,
  userWritingPrompt: string,
  storyContext: string
): string {
  const title = articleTitle.trim().slice(0, 200);
  const extra = userWritingPrompt.trim().slice(0, 400);
  const context = storyContext
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, DALLE3_STORY_CONTEXT_MAX_CHARS);

  const parts = [
    "Create a news hero image that feels related to the story topic — same mood, era, and subject family — but shown in a unique, memorable composition (unexpected angle, framing, or focal point).",
    "People are optional: include them only when the story clearly calls for human subjects; otherwise use objects, places, graphics, or atmosphere alone.",
    "If people appear, keep them generic and non-identifiable; no logos on clothing. No trademarks, watermarks, or readable headline text in the image.",
    "Photorealistic editorial or clean graphic design as fits the topic. Lighting and color should feel natural for the scene, not the same stylized grade every time.",
    title ? `Story topic (do not spell as text in the image): ${title}.` : "",
    extra ? `Editor notes: ${extra}.` : "",
    context
      ? `Thematic context — mood and ideas only: ${context}`
      : "",
  ].filter(Boolean);

  const prompt = parts.join(" ");
  return prompt.length > DALLE3_MAX_PROMPT_CHARS
    ? prompt.slice(0, DALLE3_MAX_PROMPT_CHARS)
    : prompt;
}

/** Default featured-image pipeline: DALL·E 3 text-to-image. Override with `OPENAI_IMAGE_MODEL` or `OPENAI_IMAGE_EDIT_MODEL`. */
const DEFAULT_OPENAI_IMAGE_MODEL = "dall-e-3";

export function getOpenAiImageModel(): string {
  return (
    process.env.OPENAI_IMAGE_MODEL?.trim() ||
    process.env.OPENAI_IMAGE_EDIT_MODEL?.trim() ||
    DEFAULT_OPENAI_IMAGE_MODEL
  ).toLowerCase();
}

export function isDallE3ImageModel(model: string): boolean {
  return model.toLowerCase() === "dall-e-3";
}

/**
 * Download image bytes from an absolute http(s) URL (crawled thumbnail).
 */
export async function fetchImageBytesFromUrl(imageUrl: string): Promise<Buffer> {
  const res = await fetch(imageUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
    headers: {
      "User-Agent": "NewsMediaApp/1.0 (article-image-edit)",
    },
  });

  if (!res.ok) {
    throw new OpenAiImageError(`Failed to fetch source image (${res.status})`);
  }

  const len = res.headers.get("content-length");
  if (len && Number(len) > MAX_SOURCE_DOWNLOAD_BYTES) {
    throw new OpenAiImageError("Source image is too large to process");
  }

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_SOURCE_DOWNLOAD_BYTES) {
    throw new OpenAiImageError("Source image is too large to process");
  }

  return Buffer.from(arrayBuffer);
}

/**
 * Normalize crawled/uploaded assets to landscape PNG under 4MB for OpenAI image edits.
 */
export async function normalizeImageForOpenAiEdit(input: Buffer): Promise<Buffer> {
  const { width, height } = getOpenAiImageDimensions();
  const png = await sharp(input)
    .rotate()
    .resize(width, height, { fit: "cover", position: "attention" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  if (png.length > 4 * 1024 * 1024) {
    throw new OpenAiImageError("Normalized PNG still exceeds OpenAI 4MB limit");
  }

  return png;
}

type OpenAiEditResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
  error?: { message?: string };
};

function isGptImageEditModel(model: string): boolean {
  return /^gpt-image/i.test(model) || model === "chatgpt-image-latest";
}

/** `input_fidelity` is not supported on all GPT Image variants (e.g. gpt-image-2). */
function supportsInputFidelity(model: string): boolean {
  return /^gpt-image-1/i.test(model);
}

/**
 * DALL·E 3 image generation (text prompt only). Use for the default featured-image flow.
 * @see https://developers.openai.com/api/reference/resources/images/methods/generate
 */
export async function generateImageWithDallE3(prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new OpenAiImageError("OPENAI_API_KEY is not configured");
  }

  const quality =
    (process.env.OPENAI_DALLE3_QUALITY?.trim() ?? "").toLowerCase() === "hd" ? "hd" : "standard";
  const style =
    (process.env.OPENAI_DALLE3_STYLE?.trim() ?? "").toLowerCase() === "vivid" ? "vivid" : "natural";

  const res = await fetch(OPENAI_IMAGES_GENERATIONS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: getOpenAiImageSize(),
      quality,
      style,
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const json = (await res.json().catch(() => null)) as OpenAiEditResponse | null;

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      `OpenAI DALL·E 3 generation failed (${res.status})`;
    throw new OpenAiImageError(msg, res.status, json);
  }

  const first = json?.data?.[0];
  if (!first) {
    throw new OpenAiImageError("OpenAI returned no image data", res.status, json);
  }

  if (first.b64_json) {
    return Buffer.from(first.b64_json, "base64");
  }

  if (first.url) {
    const imgRes = await fetch(first.url, { signal: AbortSignal.timeout(60_000) });
    if (!imgRes.ok) {
      throw new OpenAiImageError("Failed to download generated image from OpenAI URL");
    }
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new OpenAiImageError("OpenAI response missing url and b64_json", res.status, json);
}

/**
 * OpenAI image edits: reference PNG + prompt. Use for `dall-e-2` or GPT Image models — not `dall-e-3`.
 * Model from `OPENAI_IMAGE_MODEL` or `OPENAI_IMAGE_EDIT_MODEL` (default `dall-e-3` uses {@link generateImageWithDallE3} instead).
 * API key must be server-side only.
 * @see https://developers.openai.com/api/reference/resources/images/methods/edit
 */
export async function editImageWithDallE2(
  pngBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new OpenAiImageError("OPENAI_API_KEY is not configured");
  }

  const model = getOpenAiImageModel();
  if (isDallE3ImageModel(model)) {
    throw new OpenAiImageError(
      "dall-e-3 does not support image edits; use generateImageWithDallE3 or set OPENAI_IMAGE_MODEL to dall-e-2"
    );
  }

  const gptImage = isGptImageEditModel(model);

  const form = new FormData();
  const file = new File([new Uint8Array(pngBuffer)], "source.png", { type: "image/png" });
  // GPT Image edits expect `image[]` in multipart; legacy DALL·E 2 uses `image`.
  form.append(gptImage ? "image[]" : "image", file);
  form.append("prompt", prompt);
  form.append("model", model);
  form.append("n", "1");
  form.append("size", getOpenAiImageSize());
  if (gptImage) {
    form.append("output_format", "png");
    if (supportsInputFidelity(model)) {
      // Default `low` so edits diverge from the crawled frame; set OPENAI_IMAGE_INPUT_FIDELITY=high to stay closer to source pixels.
      const fid = (process.env.OPENAI_IMAGE_INPUT_FIDELITY?.trim() ?? "").toLowerCase();
      form.append("input_fidelity", fid === "high" ? "high" : "low");
    }
  }
  // Do not send `response_format`: newer Images API rejects it for some edit models ("Unknown parameter").

  const res = await fetch(OPENAI_IMAGES_EDITS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });

  const json = (await res.json().catch(() => null)) as OpenAiEditResponse | null;

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      `OpenAI image edit failed (${res.status})`;
    throw new OpenAiImageError(msg, res.status, json);
  }

  const first = json?.data?.[0];
  if (!first) {
    throw new OpenAiImageError("OpenAI returned no image data", res.status, json);
  }

  if (first.b64_json) {
    return Buffer.from(first.b64_json, "base64");
  }

  if (first.url) {
    const imgRes = await fetch(first.url, { signal: AbortSignal.timeout(60_000) });
    if (!imgRes.ok) {
      throw new OpenAiImageError("Failed to download edited image from OpenAI URL");
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    return buf;
  }

  throw new OpenAiImageError("OpenAI response missing url and b64_json", res.status, json);
}
