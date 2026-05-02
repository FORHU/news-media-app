import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RequestSchema = z.object({
  tweetId: z.string().min(1, "tweetId is required"),
  categoryId: z.string().min(1, "categoryId is required"),
  generationPrompt: z.string().optional().or(z.literal("")),
  language: z.string().optional(),
});

function getAiSystemInstruction(authorName: string, authorHandle: string, sourceUrl?: string, requestedLanguage?: string) {
  const creditInstruction = sourceUrl
    ? `\n9. SOURCE CREDITING: You MUST end the article with exactly one line: "Reference: ${sourceUrl}". This line must be inside the <content> tag and separated from the last paragraph by exactly two newlines.`
    : "";

  const languageInstruction = requestedLanguage 
    ? `By default, you MUST write the article in ${requestedLanguage}.`
    : `By default, you MUST write the article in English.`;

  return `
[PERSONA]:
- You are a senior news editor and investigative journalist.
- You have received a "First-Hand Report" from a social media source (X/Twitter).
- Your goal is to transform this brief report into a professional, authoritative, and comprehensive news article.

[SOURCE INFORMATION]:
- Source Name: ${authorName}
- Source Handle: @${authorHandle}

[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>WRITE A CATCHY, NEWS-WORTHY HEADLINE HERE</title>
  <content>The article paragraphs...</content>

[WRITING CONSTRAINTS]:
1. THE OBSERVER: Treat the [SOURCE TWEET] as your primary source of intelligence.
2. EXPANSION: Use the information in the tweet as the core fact. Expand on the potential implications, context, or surrounding events naturally.
3. NO META-COMMENTARY: NEVER mention that you are "writing an article based on a tweet" or "analyzing a post". Write the news as it is happening.
4. TONE: Objective, professional, and serious. Avoid slang or social media language.
5. PARAGRAPHS: Divide the content into 3-5 distinct paragraphs. Use exactly two newlines (an empty line) between each paragraph.
6. NO MARKDOWN: Do not use bold, italics, or lists.
7. LANGUAGE: ${languageInstruction}
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

    const { tweetId, categoryId, generationPrompt: customPrompt, language: requestedLanguage } = result.data;
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
    const tweetUrl = tweet.profileUrl ? `${tweet.profileUrl.replace(/\/$/, '')}/status/${tweet.tweetId}` : undefined;

    const instruction = getAiSystemInstruction(
        tweet.sourceName || "Unknown Source", 
        authorHandle,
        tweetUrl, 
        requestedLanguage
    );

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
            } catch (err: any) {
                logs.push(`Error connecting to transcription service: ${err.message}`);
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
[SOURCE TWEET]:
${tweet.text}${videoTranscript}

[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / ADDITIONAL CONTEXT]:
${customPrompt || "Transform this primary source report into a full investigative news article."}

CRITICAL: Generate the article now using the <title> and <content> tags.
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

        const { title, content } = extractArticleData(response, `Analysis: ${tweet.sourceName} on X`);

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
          data: { status: "generated" }
        });

        return NextResponse.json({ article: contentArticle, logs });
    } catch (err: any) {
        clearTimeout(timeout);
        console.error("AI Generation Process Error:", err);
        return NextResponse.json({ 
            error: err.name === 'AbortError' ? "AI Service timed out" : err.message || "Failed to generate article" 
        }, { status: err.name === 'AbortError' ? 504 : 500 });
    }
  } catch (error: any) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
