import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RequestSchema = z.object({
  topic: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  content: z.string().optional(),
  prompt: z.string().optional(),
  fileContent: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
}).refine(data => data.topic || data.content || data.fileContent, {
  message: "At least one of topic, content, or fileContent must be provided"
});

// Safety truncation to avoid token limit errors
function truncateContent(text: string, limit: number = 12000): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Truncated due to length]";
}

// AI persona/instruction
function getAiSystemInstruction(categories: string[]) {
  return `
[FORMATTING RULES]:
- STRUCTURE: Use ONLY these tags for your response:
  <title>Headline</title>
  <category>One choice from: [${categories.join(", ")}]</category>
  <content>The article paragraphs</content>
- RULES: No intro phrases, no markdown, and no AI-clichés.
- OUTPUT: Write the content inside the tags in English unless otherwise requested.
`;
}

// Handles title extraction from the AI response.
function extractArticleData(
  responseText: string | null | undefined,
  fallbackTitle: string
) {
  if (!responseText) return { title: fallbackTitle, categoryName: null, content: "" };

  const extractTag = (tag: string) => {
    const regex = new RegExp(`(?:\\*+)?<${tag}>(?:\\*+)?([\\s\\S]*?)(?:\\*+)?</${tag}>(?:\\*+)?`, "i");
    const match = responseText.match(regex);
    return match ? match[1].trim() : null;
  };

  const title = extractTag("title") || fallbackTitle;
  const categoryName = extractTag("category");
  const content = extractTag("content") || "";

  return { title, categoryName, content };
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
      topic, 
      categoryId, 
      content: rawContent, 
      prompt: customPrompt,
      fileContent,
      imageUrl
    } = result.data;

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

    const sessionRes = await fetch(`${baseUrl}/session-id`);
    if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
    const { session_id } = await sessionRes.json();

    const dbCategories = await prisma.category.findMany();
    const categoryNames = dbCategories.map(c => c.categoryName);
    const instruction = getAiSystemInstruction(categoryNames);

    const materialsText = [
      rawContent,
      fileContent ? `[FILE MATERIALS]:\n${fileContent}` : null
    ].filter(Boolean).join("\n\n");

    const truncatedInput = truncateContent(materialsText || "No additional content provided.");

    // Construct the manual prompt
    const aiPayload = {
      user_input: `
[ARTICLE CONTEXT / TOPIC]:
${topic || "Not provided"}

[SOURCE MATERIALS]:
${truncatedInput}

[SYSTEM INSTRUCTIONS]:
${instruction}

[USER REQUEST / FINAL TASK]:
${customPrompt || "Generate a professional news article based on the provided context and materials. Ensure it is in English."}

CRITICAL: Fulfill the USER REQUEST using the STRUCTURE defined in SYSTEM INSTRUCTIONS.
`,
      session_id,
      persona_prefix: "NewsLetter",
      document_context: truncatedInput,
    };

    console.log("[Manual AI Generate] Sending Payload (Truncated):", JSON.stringify({ ...aiPayload, user_input: aiPayload.user_input.substring(0, 500) + "..." }, null, 2));

    const controller = new AbortController();
    const timeoutCount = 180000; // 180s
    const timeout = setTimeout(() => controller.abort(), timeoutCount);

    try {
      const chatRes = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!chatRes.ok) {
        const errorData = await chatRes.json().catch(() => ({}));
        console.error("[Manual AI Generate] Error Status:", chatRes.status, errorData);
        throw new Error(errorData?.detail || `AI service reported an error (Status: ${chatRes.status})`);
      }

      const { response } = await chatRes.json();
      if (!response) throw new Error("AI service returned empty response");

      const extracted = extractArticleData(response, topic || "New Article");
      const title = extracted.title;
      const content = extracted.content;

      if (!content || content.length < 50) {
        throw new Error("AI failed to generate a complete article. Please refine your prompt or materials and try again.");
      }

      // Resolve Category
      let resolvedCategoryId = categoryId;
      const categoryName = extracted.categoryName;
      if (categoryName) {
        const matchedCategory = dbCategories.find(
          c => c.categoryName.toLowerCase() === categoryName.toLowerCase()
        );
        if (matchedCategory) {
          resolvedCategoryId = matchedCategory.id;
        }
      }

      const user =
        (await prisma.user.findUnique({ where: { email: "admin@newsmedia.app" } })) ||
        (await prisma.user.findFirst());

      if (!user) throw new Error("No system user found for attribution");

      const contentArticle = await prisma.contentArticle.create({
        data: {
          title,
          content,
          imageUrl: imageUrl || null,
          status: "pending",
          usersId: user.id,
          categoryId: resolvedCategoryId,
          publishDate: new Date(),
        },
      });

      return NextResponse.json(contentArticle);
    } catch (error: any) {
      clearTimeout(timeout);
      const isTimeout = error.name === "AbortError";
      return NextResponse.json(
        { error: isTimeout ? "AI generation request timed out." : error.message || "Failed to generate content" },
        { status: isTimeout ? 504 : 500 }
      );
    }
  } catch (error: any) {
    console.error("Manual AI Generation error:", error);
    return NextResponse.json({ error: "Invalid request or server error" }, { status: 400 });
  }
}
