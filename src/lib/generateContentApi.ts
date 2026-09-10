/**
 * Thin client for the "Chat Wonder" AI content-generation service
 * (env.GENERATE_CONTENT_API — see createFromUpload routes for the full
 * generation flow). This file only covers the pieces reused across multiple
 * callers: acquiring a session id, and asking the service to paraphrase an
 * already-written article (used by General Publish's manual-entry fan-out so
 * every target tenant gets independently-worded text instead of an identical
 * copy, while still sharing the same image).
 */

const TAG_REGEX = (tag: string) =>
  new RegExp(`(?:\\*+)?<${tag}>(?:\\*+)?([\\s\\S]*?)(?:\\*+)?</${tag}>(?:\\*+)?`, "i");

export async function getAiSessionId(baseUrl: string): Promise<string> {
  const res = await fetch(`${baseUrl}/session-id`);
  if (!res.ok) {
    throw new Error(`Could not connect to AI service (session-id) - Status: ${res.status}`);
  }
  const data = await res.json();
  return data.session_id;
}

/**
 * Completes the documented session-id → chat → approve flow. /approve only
 * applies when /chat triggered a pending function/tool call needing human
 * sign-off (the HITL endpoints — /set-hitl, /hitl-status — govern this); a
 * plain text-generation session usually has nothing pending, and the service
 * reports that as 400 "No pending function call for this session." — that
 * specific response is expected, not an error, so it's swallowed silently.
 * Any other failure is logged, not thrown, since the article text is already
 * in hand from /chat and /approve returns a plain status string (bookkeeping),
 * not content.
 */
export async function approveChatSession(
  baseUrl: string,
  sessionId: string,
  comments = "Auto-approved by news-media-app"
): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, decision: "approved", comments }),
    });
    if (!res.ok) {
      const errorData: { detail?: unknown } = await res.json().catch(() => ({}));
      const detail = typeof errorData?.detail === "string" ? errorData.detail : null;
      if (detail?.includes("No pending function call")) return;
      throw new Error(detail || `AI approve error (${res.status})`);
    }
  } catch (err) {
    console.error("[generateContentApi] /approve failed (continuing with the generated content):", err);
  }
}

function extractArticleTags(
  responseText: string | null | undefined,
  fallbackTitle: string,
  fallbackContent: string
) {
  if (!responseText) return { title: fallbackTitle, content: fallbackContent };

  const extractTag = (tag: string) => {
    const match = responseText.match(TAG_REGEX(tag));
    return match ? match[1].trim() : null;
  };

  return {
    title: extractTag("title") || fallbackTitle,
    content: extractTag("content") || fallbackContent,
  };
}

function buildParaphraseInstruction(): string {
  return `
[PERSONA]:
- You are a professional news editor producing an independent rewrite of an existing article for republication on a different news website.

[TASK]:
Rewrite the article below so it conveys the same facts, meaning, and tone using substantially different wording, sentence structure, and phrasing — a genuinely distinct piece of writing, not a copy with minor edits. Do not add, remove, or alter any facts.

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>REWRITTEN HEADLINE</title>
  <content>The rewritten article paragraphs...</content>
- NO MARKDOWN, NO META-COMMENTARY, NO INTRO PHRASES (e.g. "Here is the rewritten article").
- Never mention that this is a rewrite, paraphrase, or republished version.
- Keep the paragraph structure roughly similar, separated by a blank line between each paragraph.
- LANGUAGE: Write in the same language as the original article.
`;
}

/**
 * Asks the AI service to rewrite `title`/`content` into a distinctly-worded
 * version carrying the same facts. Throws on failure/timeout/incomplete
 * output — callers should catch this and fall back to the original text
 * rather than letting one tenant's paraphrase failure abort a broadcast.
 */
export async function paraphraseArticle(params: {
  baseUrl: string;
  sessionId: string;
  title: string;
  content: string;
}): Promise<{ title: string; content: string }> {
  const { baseUrl, sessionId, title, content } = params;

  const userInput = `
[SYSTEM INSTRUCTIONS]:
${buildParaphraseInstruction()}

[ORIGINAL ARTICLE]:
<title>${title}</title>
<content>${content}</content>
`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_input: userInput,
        session_id: sessionId,
        persona_prefix: "NewsLetter",
        document_context: content,
        image_context: "",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errorData: { detail?: string } = await res.json().catch(() => ({}));
      throw new Error(errorData?.detail || `AI paraphrase error (${res.status})`);
    }

    const { response } = (await res.json()) as { response?: string };
    const result = extractArticleTags(response, title, content);

    if (!result.content || result.content.length < 30) {
      throw new Error("AI returned an incomplete paraphrase");
    }

    await approveChatSession(baseUrl, sessionId);

    return result;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
