import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { getValidImageSrc } from "@/lib/image-utils";
import { stripOriginalPostBlock } from "@/lib/tweetArticleDisplay";
import { runOpenAiFeaturedImagePipeline } from "@/lib/featuredImagePipeline";

const articleInclude = {
  category: true,
  user: { select: { firstName: true, lastName: true } },
  rawArticle: { include: { category: true, crawledUrl: true } },
  rawVideo: true,
  rawSourceUpload: true,
  rawTweet: true,
} as const;

export type RegeneratableArticle = Prisma.ContentArticleGetPayload<{
  include: typeof articleInclude;
}>;

function truncateContent(text: string, limit: number = 12000): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Truncated due to length]";
}

/** Gives the model the published draft to revise when the user supplies revision instructions. */
function buildCurrentArticleRevisionBlock(article: RegeneratableArticle): string {
  const excerpt = truncateContent(article.content ?? "", 8000);
  return `
[CURRENT GENERATED VERSION — revise according to the user instructions above. Keep facts accurate; improve headline and body as directed]:
Title: ${article.title}
${excerpt ? `Body:\n${excerpt}` : "(no body yet)"}
`;
}

function extractArticleData(
  responseText: string | null | undefined,
  fallbackTitle: string
) {
  if (!responseText) return { title: fallbackTitle, content: "" };

  const extractTag = (tag: string) => {
    const regex = new RegExp(
      `(?:\\*+)?<${tag}>(?:\\*+)?([\\s\\S]*?)(?:\\*+)?</${tag}>(?:\\*+)?`,
      "i"
    );
    const match = responseText.match(regex);
    return match ? match[1].trim() : null;
  };

  let title = extractTag("title") || fallbackTitle;
  const content = extractTag("content") || "";

  const genericPlaceholders = [
    "headline",
    "write a catchy headline here",
    "your catchy headline here",
    "title here",
    "article headline",
  ];

  if (genericPlaceholders.some((p) => title.toLowerCase() === p.toLowerCase())) {
    title = fallbackTitle;
  }

  return { title, content };
}

async function fetchAiSessionId(baseUrl: string): Promise<string> {
  const sessionRes = await fetch(`${baseUrl}/session-id`, { cache: "no-store" });
  if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
  const { session_id } = await sessionRes.json();
  if (!session_id) throw new Error("AI service returned no session id");
  return session_id;
}

/** Article text regeneration — GENERATE_CONTENT_API `/chat` only (not OpenAI images). */
async function callAiChat(
  baseUrl: string,
  payload: Record<string, unknown>,
  timeoutMs = 180_000
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const chatRes = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!chatRes.ok) {
      const errorData = await chatRes.json().catch(() => ({}));
      throw new Error(
        errorData?.detail ||
          errorData?.error ||
          `AI service error (${chatRes.status})`
      );
    }
    const { response } = await chatRes.json();
    if (!response) throw new Error("AI service returned an empty response");
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function getCrawledAiSystemInstruction(
  sourceUrl?: string,
  requestedLanguage?: string
) {
  const creditInstruction = sourceUrl
    ? `\n9. SOURCE CREDITING: You MUST end the article with exactly one line: "Reference: ${sourceUrl}". This line must be inside the <content> tag and separated from the last paragraph by exactly two newlines (an empty line between them).`
    : "";

  const languageInstruction = requestedLanguage
    ? `You MUST write the article in ${requestedLanguage}.`
    : `By default, you MUST write the article in the SAME LANGUAGE as the provided [SOURCE ARTICLE].`;

  return `
[PERSONA]:
- You are a senior investigative journalist and professional news editor.
- Your writing style is objective, authoritative, and concise.

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>WRITE A CATCHY HEADLINE HERE</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. THE OBSERVER: You are a reporter on the ground. The "Source Article" provided below contains your first-hand observations of the scene.
2. NO META-COMMENTARY: NEVER mention that you are analyzing an article, looking at a photo, or were provided with an analysis.
3. NO CONCLUDING SUMMARIES: Never start a paragraph with "In summary", "In conclusion", "Overall", or "Ultimately".
4. JOURNALISTIC TONE: Focus on facts and implications.
5. NO MARKDOWN: Do not use bold, italics, or lists.
6. HEADLINE: The headline must be punchy and news-worthy.
7. PARAGRAPH STRUCTURE: Divide the content into 3-5 distinct paragraphs. Use exactly two newlines between each paragraph.
8. LANGUAGE: ${languageInstruction}${creditInstruction ? `\n9. ${creditInstruction.trim()}` : ""}
`;
}

function getUploadAiSystemInstruction(requestedLanguage?: string) {
  const languageInstruction = requestedLanguage
    ? `You MUST write the article in ${requestedLanguage}.`
    : `By default, write in the same language as the provided materials.`;

  return `
[PERSONA]:
- You are a senior investigative journalist and professional news editor.

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags:
  <title>WRITE A CATCHY HEADLINE HERE</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. Write as a finished news article from the source materials.
2. NO META-COMMENTARY about images or AI.
3. NO MARKDOWN.
4. LANGUAGE: ${languageInstruction}
`;
}

function getTweetAiSystemInstruction(
  authorName: string,
  authorHandle: string,
  generationMode: "standalone" | "commentary",
  sourceUrl?: string,
  requestedLanguage?: string
) {
  const languageInstruction = requestedLanguage
    ? `You MUST write the article in ${requestedLanguage}.`
    : `Write in the SAME LANGUAGE as the [SOURCE TWEET].`;

  const modeConstraints =
    generationMode === "standalone"
      ? `Write standalone news; no embedded social post block.`
      : `Write commentary only; no "--- ORIGINAL POST ---" section.`;

  return `
[PERSONA]:
- Senior news editor transforming a social post into publication-ready prose.

[FORMATTING RULES]:
- Use only <title> and <content> tags.

[WRITING CONSTRAINTS]:
1. Source: ${authorName} (@${authorHandle})
2. ${modeConstraints}
3. LANGUAGE: ${languageInstruction}
${sourceUrl ? `4. End <content> with: Reference: ${sourceUrl}` : ""}
`;
}

function getYoutubeAiSystemInstruction(
  youtubeUrl: string,
  generationMode: string,
  requestedLanguage?: string
) {
  const languageInstruction = requestedLanguage
    ? `Write in ${requestedLanguage}.`
    : `Write in the same language as the transcript.`;

  return `
[PERSONA]:
- Senior investigative journalist.

[FORMATTING RULES]:
- Use only <title> and <content> tags.

[WRITING CONSTRAINTS]:
1. Base the article on the video transcript.
2. ${generationMode === "commentary" ? "Write commentary, not a transcript dump." : "Write a news article, not a transcript dump."}
3. LANGUAGE: ${languageInstruction}
4. End <content> with: Reference: ${youtubeUrl}
`;
}

export async function fetchRegeneratableArticle(
  id: string,
  tenantId: string
): Promise<RegeneratableArticle | null> {
  return prisma.contentArticle.findFirst({
    where: { id, tenantId },
    include: articleInclude,
  });
}

async function persistTextUpdate(
  article: RegeneratableArticle,
  title: string,
  content: string
): Promise<RegeneratableArticle> {
  let slug = article.slug;
  if (title !== article.title) {
    slug = await generateUniqueArticleSlug(
      prisma,
      title,
      article.publishDate ?? new Date()
    );
  }

  return prisma.contentArticle.update({
    where: { id: article.id },
    data: { title, content, slug },
    include: articleInclude,
  });
}

/** Article text regeneration — GENERATE_CONTENT_API `/chat` only (not OpenAI images). */
export async function regenerateGeneratedArticleText(
  article: RegeneratableArticle,
  tenantId: string,
  options?: { generationPrompt?: string }
): Promise<RegeneratableArticle> {
  const customPrompt = options?.generationPrompt?.trim() ?? "";
  if (!customPrompt) {
    throw new Error("Revision instructions are required to regenerate text.");
  }
  const revisionBlock = buildCurrentArticleRevisionBlock(article);
  const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
  if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

  const session_id = await fetchAiSessionId(baseUrl);
  let responseText: string;
  let fallbackTitle = article.title;
  let postProcess: ((content: string) => string) | null = null;

  switch (article.sourceType) {
    case "ARTICLE": {
      if (!article.rawArticle) {
        throw new Error("This article has no linked crawled source to regenerate from.");
      }
      const raw = article.rawArticle;
      const sourceUrl = raw.crawledUrl?.url;
      const language = undefined;
      const instruction = getCrawledAiSystemInstruction(sourceUrl, language);
      const truncatedInput = truncateContent(raw.content || raw.title || "");
      fallbackTitle = raw.title;

      responseText = await callAiChat(baseUrl, {
        user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / REVISION TASK]:
${customPrompt}

${revisionBlock}

[SOURCE ARTICLE]:
${truncatedInput}

CRITICAL: Use the STRUCTURE defined in SYSTEM INSTRUCTIONS. Apply the revision to the current generated version while staying grounded in the source article.
`,
        session_id,
        persona_prefix: "NewsLetter",
        raw_article_id: raw.id,
        document_context: truncatedInput,
      });
      break;
    }
    case "TWEET": {
      if (!article.rawTweet) {
        throw new Error("This article has no linked tweet source to regenerate from.");
      }
      const tweet = article.rawTweet;
      const generationMode =
        (tweet.generationMode as "standalone" | "commentary") || "standalone";
      const authorHandle = tweet.profileUrl
        ? tweet.profileUrl.split("/").filter(Boolean).pop() || "X_User"
        : "X_User";
      const tweetUrl = tweet.profileUrl
        ? `${tweet.profileUrl.replace(/\/$/, "")}/status/${tweet.tweetId}`
        : `https://x.com/i/status/${tweet.tweetId}`;
      const instruction = getTweetAiSystemInstruction(
        tweet.sourceName || "Unknown Source",
        authorHandle,
        generationMode,
        tweetUrl,
        undefined
      );
      fallbackTitle = `Analysis: ${tweet.sourceName || "X"} on X`;
      if (generationMode === "commentary") {
        postProcess = stripOriginalPostBlock;
      }

      const defaultUserAsk =
        generationMode === "standalone"
          ? "Transform this primary source into a full investigative news article."
          : "Write commentary only; end with the Reference line only.";

      responseText = await callAiChat(baseUrl, {
        user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / REVISION TASK]:
${customPrompt || defaultUserAsk}

${revisionBlock}

[SOURCE TWEET]:
${tweet.text}

CRITICAL: Generate using <title> and <content> tags. Revise the current generated version using the source tweet.
`,
        session_id,
        persona_prefix: "NewsLetterX",
        document_context: tweet.text,
      });
      break;
    }
    case "VIDEO": {
      if (!article.rawVideo) {
        throw new Error("This article has no linked video source to regenerate from.");
      }
      const video = article.rawVideo;
      const youtubeUrl = video.youtubeUrl || article.youtubeUrl || "";
      const instruction = getYoutubeAiSystemInstruction(
        youtubeUrl,
        video.generationMode || "standalone",
        video.language ?? undefined
      );
      const materials = truncateContent(video.transcribedContent || "");
      const storedPrompt = video.prompt?.trim() || "";

      responseText = await callAiChat(baseUrl, {
        user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / REVISION TASK]:
${customPrompt || storedPrompt}

${revisionBlock}

[SOURCE MATERIALS]:
${materials}
`,
        session_id,
        persona_prefix: "NewsLetter",
        document_context: materials,
      });
      break;
    }
    case "UPLOAD": {
      if (!article.rawSourceUpload) {
        throw new Error("This article has no linked upload source to regenerate from.");
      }
      const upload = article.rawSourceUpload;
      const language = upload.language ?? undefined;
      const instruction = getUploadAiSystemInstruction(language);
      const materials = truncateContent(upload.extractedText || "");
      const storedPrompt = upload.prompt?.trim() || "";

      responseText = await callAiChat(baseUrl, {
        user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / REVISION TASK]:
${customPrompt || storedPrompt}

${revisionBlock}

[SOURCE MATERIALS]:
${materials}
`,
        session_id,
        persona_prefix: "NewsLetter",
        document_context: materials,
      });
      break;
    }
    default: {
      const instruction = getCrawledAiSystemInstruction(undefined, undefined);
      const materials = truncateContent(article.content || article.title);
      responseText = await callAiChat(baseUrl, {
        user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / REVISION TASK]:
${customPrompt}

${revisionBlock}

[SOURCE MATERIALS]:
${materials}
`,
        session_id,
        persona_prefix: "NewsLetter",
        document_context: materials,
      });
    }
  }

  let { title, content } = extractArticleData(responseText, fallbackTitle);
  if (postProcess) content = postProcess(content);

  if (!content || content.length < 50) {
    throw new Error("AI failed to generate enough content. Try again with a custom prompt.");
  }

  return persistTextUpdate(article, title, content);
}

/** Featured image regeneration — OpenAI Images API only (not `/chat`). */
export async function regenerateGeneratedArticleImage(
  article: RegeneratableArticle,
  tenantId: string,
  options?: { generationPrompt?: string }
): Promise<RegeneratableArticle> {
  const customPrompt = options?.generationPrompt?.trim() ?? "";
  if (!customPrompt) {
    throw new Error("Revision instructions are required to regenerate the image.");
  }

  const sourceImageUrl =
    article.rawArticle?.imageUrl ??
    article.rawSourceUpload?.s3ImageUrl ??
    article.imageUrl;

  const { imageUrl, log } = await runOpenAiFeaturedImagePipeline({
    tenantId,
    articleTitle: article.title,
    userPrompt: customPrompt,
    sourceImageUrl,
    storyExcerpt: truncateContent(article.content || "", 1200),
  });

  console.log("[Regenerate Image] OpenAI pipeline:", JSON.stringify(log, null, 2));

  if (log.outcome !== "openai_success" || !imageUrl) {
    throw new Error(
      log.detail ||
        "OpenAI image regeneration failed. Check OPENAI_API_KEY and source image URL."
    );
  }

  return prisma.contentArticle.update({
    where: { id: article.id },
    data: { imageUrl },
    include: articleInclude,
  });
}
