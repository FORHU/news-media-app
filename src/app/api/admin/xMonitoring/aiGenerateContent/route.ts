import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { stripOriginalPostBlock } from "@/lib/tweetArticleDisplay";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const tweetGenerationModeSchema = z.enum(["standalone", "commentary"]);

const RequestSchema = z.object({
  tweetId: z.string().min(1, "tweetId is required"),
  categoryId: z.string().min(1, "categoryId is required"),
  generationPrompt: z.string().optional().or(z.literal("")),
  language: z.string().optional(),
  generationMode: z.preprocess((val: unknown) => {
    // Legacy UI values → commentary
    if (val === "commentary_support" || val === "commentary_oppose") return "commentary";
    return val;
  }, tweetGenerationModeSchema.optional().default("standalone")),
});

type TweetGenerationMode = z.infer<typeof tweetGenerationModeSchema>;

function getAiSystemInstruction(
  authorName: string,
  authorHandle: string,
  generationMode: TweetGenerationMode,
  sourceUrl?: string,
  requestedLanguage?: string
) {
  const creditInstruction = sourceUrl
    ? `\nSOURCE CREDITING: You MUST end <content> with exactly one line after the body: "Reference: ${sourceUrl}". Separate that line from the last paragraph by exactly two newlines (one blank line).`
    : "";

  const languageInstruction = requestedLanguage
    ? `You MUST write the article in ${requestedLanguage}. 
    
    [CRITICAL TRANSLATION STEP]:
    If you are translating between two non-English languages (e.g., Korean to Japanese, or Korean to Chinese), please follow this internal process:
    1. Mentally translate the key points of the source material into English.
    2. Then, rewrite and generate the final news article ENTIRELY in ${requestedLanguage} based on those English points.
    
    This pivot translation ensures the highest journalistic quality and accuracy. The final output must be 100% ${requestedLanguage}.`
    : `By default, you MUST write the article in the SAME LANGUAGE as the provided [SOURCE TWEET] (e.g., if the source tweet is in Korean, write the generated article in Korean).`;

  const modeConstraints =
    generationMode === "standalone"
      ? `8. STANDALONE NEWS: Write as a standard wire-style news article. Do NOT include a demarcated block that reproduces the source post as an embedded social item (no "--- ORIGINAL POST ---" section). Integrate facts into continuous reporting; the piece must read like independent journalism, not social round-up.
9. NO SOCIAL FRAME: Do not paste or quote the post as a standalone embed. Brief indirect paraphrase is acceptable where needed for clarity.`
      : `8. SOCIAL COMMENTARY: Write an opinion piece that engages with the source post. Match angle, stance, and emphasis to [USER REQUEST / ADDITIONAL CONTEXT] when instructions are provided; otherwise balanced, substantive commentary.
9. NO REPRODUCTION BLOCK: NEVER use "--- ORIGINAL POST ---", "--- END ORIGINAL POST ---", horizontal-rule fences, quoted full transcripts of the post, attribution lines ("— @[handle]"), or the post URL in the body. The published page shows the real post in an embed above the article—write only your analysis in continuous paragraphs.
10. NO FULL-POST PASTE: Do not paste the tweet text verbatim in the article; paraphrase or refer at most briefly if needed.
11. BODY ENDS BEFORE REFERENCE: The prose must end at the final commentary paragraph, then SOURCE CREDITING adds the single Reference line—never end the body with a pasted quote block, status URL line, or "— @[handle]" line.`;

  const personaLine =
    generationMode === "standalone"
      ? `- Your goal is to transform this brief report into a professional, authoritative, and comprehensive news article.`
      : `- Your goal is to produce compelling commentary on a post from X/Twitter. Readers will see the post in an on-page embed; your text is analysis only, plus the single Reference line at the end.`;

  return `
[PERSONA]:
- You are a senior news editor and investigative journalist.
- You have received a "First-Hand Report" from a social media source (X/Twitter).
${personaLine}

[SOURCE INFORMATION]:
- Source Name: ${authorName}
- Source Handle: @${authorHandle}
${sourceUrl ? `- Canonical post URL: ${sourceUrl}` : ""}

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>WRITE A CATCHY, NEWS-WORTHY HEADLINE HERE</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. THE OBSERVER: Treat the [SOURCE TWEET] as your primary source of intelligence.
2. EXPANSION: Use the information in the tweet as the core fact. Expand on the potential implications, context, or surrounding events naturally.
3. NO META-COMMENTARY: NEVER mention that you are "writing an article based on a tweet" or "analyzing a post". Write as a finished piece for publication.
4. TONE: Professional and serious. Avoid slang or social media language.
5. PARAGRAPHS: Divide the content into 3-5 distinct paragraphs of flowing prose. Use exactly two newlines (an empty line) between each paragraph.
6. NO MARKDOWN: Do not use bold, italics, or lists.
7. LANGUAGE: ${languageInstruction}
${modeConstraints}
${creditInstruction}
`;
}

function extractArticleData(responseText: string | null | undefined, fallbackTitle: string) {
  if (!responseText) return { title: fallbackTitle, content: "" };
  
  const extractTag = (tag: string) => {
    const regex = new RegExp(`(?:\\*+)?<${tag}>(?:\\*+)?([\\s\\S]*?)(?:\\*+)?</${tag}>(?:\\*+)?`, "i");
    const match = responseText.match(regex);
    return match ? match[1].trim() : null;
  };

  const title = extractTag("title") || fallbackTitle;
  const content = extractTag("content") || "";

  return { title, content };
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = RequestSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: result.error.issues.map(e => e.message).join(", ") 
      }, { status: 400 });
    }

    const {
      tweetId,
      categoryId,
      generationPrompt: customPrompt,
      language: requestedLanguage,
      generationMode,
    } = result.data;
    const tenantId = await resolveTenantIdFromRequest(req);
    
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tweet = await prisma.rawTweet.findUnique({
      where: { id: tweetId, tenantId }
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) {
        console.error("AI Generate Error: GENERATE_CONTENT_API is not configured");
        return NextResponse.json({ error: "AI Service Configuration Error" }, { status: 500 });
    }

    // Connect to AI Service
    let session_id;
    try {
        const sessionRes = await fetch(`${baseUrl}/session-id`, { cache: 'no-store' });
        if (!sessionRes.ok) throw new Error("Session ID fetch failed");
        const sessionData = await sessionRes.json();
        session_id = sessionData.session_id;
    } catch (err) {
        console.error("AI Service Session Error:", err);
        return NextResponse.json({ error: "Could not connect to AI service" }, { status: 503 });
    }

    const authorHandle = tweet.profileUrl ? tweet.profileUrl.split('/').filter(Boolean).pop() || "X_User" : "X_User";
    const tweetUrl = tweet.profileUrl
      ? `${tweet.profileUrl.replace(/\/$/, "")}/status/${tweet.tweetId}`
      : `https://x.com/i/status/${tweet.tweetId}`;

    const instruction = getAiSystemInstruction(
      tweet.sourceName || "Unknown Source",
      authorHandle,
      generationMode,
      tweetUrl,
      requestedLanguage
    );

    const defaultUserAsk =
      generationMode === "standalone"
        ? "Transform this primary source into a full investigative news article (standalone reporting, no embedded social post block)."
        : "Write commentary only (no quoted post, no ORIGINAL POST section); develop the piece per any directions you added above, and end with the Reference line only.";

    let videoTranscript = "";
    const logs: string[] = [];

    if (tweet.hasMedia && tweet.mediaType?.toLowerCase().includes("video")) {
        const apifyToken = process.env.APIFY_API_TOKEN;
        const videoUrlToTranscribe = tweet.mediaUrls.find(url => /\.(mp4|mov|m4v|webm|mkv|m3u8)(\?|$)/i.test(url)) || tweet.mediaUrls[0];

        if (apifyToken && videoUrlToTranscribe) {
            logs.push(`Found video URL: ${videoUrlToTranscribe}`);
            
            const tweetUrl = tweet.profileUrl 
                ? `${tweet.profileUrl.replace(/\/$/, '')}/status/${tweet.tweetId}`
                : `https://x.com/i/status/${tweet.tweetId}`;

            try {
                console.log(`[Apify] Transcribing video using tweet URL: ${tweetUrl}`);
                logs.push(`Connecting to transcription service with tweet URL: ${tweetUrl}...`);
                
                const apifyRes = await fetch(
                    `https://api.apify.com/v2/acts/apple_yang~twitter-video-transcript-api/run-sync-get-dataset-items?token=${apifyToken}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ videoUrl: tweetUrl }),
                    }
                );

                if (apifyRes.ok) {
                    const datasetItems = await apifyRes.json();
                    if (Array.isArray(datasetItems) && datasetItems.length > 0) {
                        const transcript = datasetItems[0].transcript || datasetItems[0].text;
                        if (transcript) {
                            videoTranscript = `\n\n[VIDEO TRANSCRIPT]:\n${transcript}\n`;
                            logs.push("Video transcribed successfully.");
                            console.log("[Apify] Successfully transcribed video. Transcript length:", transcript.length);
                        } else {
                            logs.push("Transcription succeeded but returned empty text.");
                            console.log("[Apify] Transcription succeeded but returned empty text. datasetItems:", JSON.stringify(datasetItems));
                        }
                    } else {
                        logs.push("Transcription service returned no data.");
                        console.log("[Apify] Transcription service returned no data. datasetItems:", JSON.stringify(datasetItems));
                    }
                } else {
                    logs.push(`Failed to transcribe video. API Status: ${apifyRes.status}`);
                    console.error("[Apify] Failed to transcribe video. Status:", apifyRes.status);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                logs.push(`Error connecting to transcription service: ${message}`);
                console.error("[Apify] Error connecting to Apify:", err);
            }
        } else if (!apifyToken) {
            logs.push("APIFY_API_TOKEN is missing. Video transcription skipped.");
            console.warn("APIFY_API_TOKEN is missing. Video transcription skipped.");
        } else {
            logs.push("No valid video URL found in mediaUrls.");
        }
    }

    const aiPayload = {
      user_input: `
[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / ADDITIONAL CONTEXT]:
${customPrompt || defaultUserAsk}

[SOURCE TWEET]:
${tweet.text}${videoTranscript}

CRITICAL: Generate the article now using the <title> and <content> tags.

FINAL MANDATE: The entire response (Headline and Content) MUST be written in ${requestedLanguage || "the same language as the source"}. DO NOT use any other language.
`,
      session_id,
      persona_prefix: "NewsLetterX",
      document_context: `${tweet.text}${videoTranscript}`,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    try {
        const chatRes = await fetch(`${baseUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiPayload),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!chatRes.ok) {
            const errorData = await chatRes.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || "AI service failed to respond");
        }

        const { response } = await chatRes.json();
        if (!response) throw new Error("AI service returned an empty response");

        const { title, content: extractedContent } = extractArticleData(response, `Analysis: ${tweet.sourceName} on X`);
        let content = extractedContent;

        if (generationMode === "commentary") {
          content = stripOriginalPostBlock(content);
        }

        if (!content || content.length < 50) {
            throw new Error("AI failed to generate a sufficient article. Try a more specific prompt.");
        }

        const user = (await prisma.user.findFirst({ where: { tenantId } })) || 
                     (await prisma.user.findFirst({ where: { email: 'admin@newsmedia.app' } }));
        
        if (!user) throw new Error("No authorized user found for article attribution");

        const publishDate = new Date();
        const slug = await generateUniqueArticleSlug(prisma, title, publishDate);

        const contentArticle = await prisma.contentArticle.create({
          data: {
            tenantId,
            title,
            slug,
            content,
            status: "pending",
            usersId: user.id,
            categoryId,
            publishDate,
            sourceType: "TWEET",
            rawTweetId: tweet.id,
          },
        });

        await prisma.rawTweet.update({
          where: { id: tweetId },
          data: { status: "generated", generationMode },
        });

        return NextResponse.json({ article: contentArticle, logs });
    } catch (err: unknown) {
        clearTimeout(timeout);
        console.error("AI Generation Process Error:", err);
        const isAbort = err instanceof Error && err.name === 'AbortError';
        const message = err instanceof Error ? err.message || "Failed to generate article" : "Failed to generate article";
        return NextResponse.json({
            error: isAbort ? "AI Service timed out" : message
        }, { status: isAbort ? 504 : 500 });
    }
  } catch (error: unknown) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
