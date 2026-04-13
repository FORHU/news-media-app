import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Handles title extraction from the AI response.
function extractTitleAndContent(responseText: string | null | undefined, rawTitle: string) {
    if (!responseText) return { title: rawTitle, content: "" };

    const lines = responseText.split('\n').filter(l => l.trim().length > 0);
    const firstLine = lines[0] || "";

    // Clean markdown symbols (#, *) and "Title:" labels from the first line
    const extracted = firstLine.replace(/^[\s#*]*(?:Title:\s*)?/i, '').replace(/[\s*#]*$/, '').trim();

    // Logic: Use new title if it's unique and of decent length; otherwise fallback to original
    if (extracted.length > 5 && extracted !== rawTitle) {
        return {
            title: extracted,
            content: lines.slice(1).join('\n\n').trim() // Double newline for paragraphs
        };
    }

    return { title: rawTitle, content: lines.join('\n\n').trim() }; // Double newline fallback
}

export async function POST(req: NextRequest) {
    try {
        // 1. Validate request (Directly without Zod for simplicity)
        const { articleId } = await req.json();
        if (!articleId) return NextResponse.json({ error: "articleId is required" }, { status: 400 });

        const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
        if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

        const rawArticle = await prisma.rawArticle.findUnique({ where: { id: articleId } });
        if (!rawArticle) return NextResponse.json({ error: "Article not found" }, { status: 404 });

        // 2. Sequence API calls to FastAPI
        const sessionRes = await fetch(`${baseUrl}/session-id`);
        if (!sessionRes.ok) throw new Error("Could not connect to AI service (session-id)");
        const { session_id } = await sessionRes.json();

        const chatRes = await fetch(`${baseUrl}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                user_input: `[NewsLetter] ${articleId}`, 
                session_id 
            }),
        });
        if (!chatRes.ok) throw new Error("AI generation service error during chat");
        const { response } = await chatRes.json();

        // 3. Process generated content and extract title
        const { title, content } = extractTitleAndContent(response, rawArticle.title);

        // 4. Persistence: Associate with an editor or fallback user
        const user = await prisma.user.findUnique({ where: { email: 'editor@newsmedia.app' } })
            || await prisma.user.findFirst();
        if (!user) throw new Error("User required for association not found in database");

        const contentArticle = await prisma.contentArticle.create({
            data: {
                title, content,
                status: "pending",
                usersId: user.id,
                categoryId: rawArticle.categoryId,
                rawArticleId: rawArticle.id,
                imageUrl: rawArticle.imageUrl, //TODO: Image generation is not yet implemented
                publishDate: new Date(),
            }
        });

        // 5. Success cleanup
        await prisma.rawArticle.update({ where: { id: articleId }, data: { status: "generated" } });

        return NextResponse.json(contentArticle);

    } catch (error: any) {
        console.error("AI Generation failed:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}