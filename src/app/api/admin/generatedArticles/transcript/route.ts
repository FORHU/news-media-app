import { NextResponse } from "next/server";
import { extractYoutubeId } from "@/lib/utils";


export async function POST(req: Request) {
    try {
        const { url } = await req.json();
        
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const apiKey = process.env.SUPADATA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "SUPADATA_API_KEY is not configured" }, { status: 500 });
        }

        // Call Supadata API with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

        try {
            const supadataUrl = `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}`;
            const res = await fetch(supadataUrl, {
                method: "GET",
                headers: { 
                    "x-api-key": apiKey,
                    "Accept": "application/json"
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                return NextResponse.json(
                    { error: data.message || "Failed to transcribe YouTube video via Supadata." },
                    { status: res.status }
                );
            }

            // Supadata returns segments in 'content' array
            const segments = data.content;
            
            if (!segments || !Array.isArray(segments) || segments.length === 0) {
                return NextResponse.json(
                    { error: "No transcript segments found for this video. Captions might be disabled or unavailable." },
                    { status: 404 }
                );
            }

            const fullTranscript = segments
                .map((segment: any) => segment.text)
                .join(" ")
                .trim();

            if (!fullTranscript) {
                return NextResponse.json(
                    { error: "Transcript content is empty." },
                    { status: 404 }
                );
            }

            const videoId = extractYoutubeId(url) || "";

            return NextResponse.json({
                video_id: videoId,
                transcript: fullTranscript
            });
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                return NextResponse.json(
                    { error: "Transcription request timed out. The video might be too long or the service is slow." },
                    { status: 504 }
                );
            }
            throw error; // Rethrow to outer catch
        }
    } catch (error: any) {
        console.error("Transcription error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
