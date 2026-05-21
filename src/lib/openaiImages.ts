import sharp from "sharp";

const OPENAI_IMAGES_EDITS = "https://api.openai.com/v1/images/edits";
const GPT_IMAGE_MINI_MODEL = "gpt-image-1-mini";
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

/** OpenAI image-edit prompt budget (keep under model limits). */
const MAX_EDIT_PROMPT_CHARS = 1600;

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

function getOpenAiImageStylePreset(): string | null {
  const raw = process.env.OPENAI_IMAGE_STYLE_PRESET?.trim();
  if (!raw) return null;
  return raw.slice(0, 280);
}

/**
 * Prompt for image-to-image edits: same story *idea* and broad scene type, but deliberately
 * different composition and art direction so the output is not a near-duplicate of the source photo.
 *
 * @param storyContext — optional short article excerpt; thematic hints only (not layout instructions).
 */
export function buildCrawledImageEditPrompt(
  articleTitle: string,
  userWritingPrompt: string,
  storyContext?: string
): string {
  const title = articleTitle.trim().slice(0, 220);
  const extra = userWritingPrompt.trim().slice(0, 360);
  const story = (storyContext ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
  const stylePreset = getOpenAiImageStylePreset();

  const parts = [
    "Create a new hero image for the same underlying news topic and broad scene category as the reference, but it must not read as the same photograph—change composition, camera angle, distance, focal length feel, negative space, and lighting.",
    "Do not copy the reference's distinctive pose, prop placement, background geometry, or iconic framing; echo only the abstract subject and setting type.",
    "Art direction may differ from the reference: you may use a different color palette and mood within the same broad medium family (e.g. editorial photo vs illustration vs clean graphic); avoid cloning the source's exact color grade, filter, or crop recipe.",
    "Stay in the same broad medium as the reference (photo, illustration, product shot, architecture, crowd, interior, etc.); do not switch to an unrelated visual category.",
    "If the reference shows people, depict different individuals and poses; if it has no people, do not add people, faces, or silhouettes.",
    "If the reference is typography or brand-forward graphics, keep a similar communication intent but use a fresh layout—no copied words, logos, split-screen structure, or logo sheets.",
    "Strip all outlet branding: no newspaper or site logos, mastheads, bylines, section pills, corner badges, credits, URLs, or readable headline text in the frame.",
    title ? `Topic hint only—do not render as readable text: ${title}.` : "",
    stylePreset ? `Required visual style direction: ${stylePreset}` : "",
    story
      ? `Story theme for mood and ideas only—do not mirror the reference image's layout: ${story}`
      : "",
    extra ? `Editor notes: ${extra}.` : "",
  ].filter(Boolean);

  let prompt = parts.join(" ");
  if (prompt.length > MAX_EDIT_PROMPT_CHARS) {
    prompt = prompt.slice(0, MAX_EDIT_PROMPT_CHARS);
  }
  return prompt;
}

/** Featured hero images use `gpt-image-1-mini` only. */
export function getOpenAiImageModel(): string {
  return GPT_IMAGE_MINI_MODEL;
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

/** `gpt-image-1-mini` edits: `low` (default), `medium`, `high`, or `auto`. */
function getGptImageMiniQuality(): "low" | "medium" | "high" | "auto" {
  const raw = (process.env.OPENAI_IMAGE_QUALITY?.trim() ?? "low").toLowerCase();
  if (raw === "medium" || raw === "high" || raw === "auto") return raw;
  return "low";
}

/**
 * Image-to-image edit via OpenAI `/v1/images/edits` using `gpt-image-1-mini`.
 * @see https://developers.openai.com/api/reference/resources/images/methods/edit
 */
export async function editImageWithGptImageMini(
  pngBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new OpenAiImageError("OPENAI_API_KEY is not configured");
  }

  const form = new FormData();
  const file = new File([new Uint8Array(pngBuffer)], "source.png", { type: "image/png" });
  form.append("image[]", file);
  form.append("prompt", prompt);
  form.append("model", GPT_IMAGE_MINI_MODEL);
  form.append("n", "1");
  form.append("size", getOpenAiImageSize());
  form.append("output_format", "png");
  form.append("quality", getGptImageMiniQuality());
  const fid = (process.env.OPENAI_IMAGE_INPUT_FIDELITY?.trim() ?? "").toLowerCase();
  form.append("input_fidelity", fid === "high" ? "high" : "low");

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
      `OpenAI gpt-image-1-mini edit failed (${res.status})`;
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
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new OpenAiImageError("OpenAI response missing url and b64_json", res.status, json);
}
