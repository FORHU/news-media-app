import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();
        
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Keep using the existing env var, but proxy it securely through the NextJS backend
        const baseUrl = (process.env.NEXT_PUBLIC_TRANSCRIPT_API_URL || "http://localhost:8000").replace(/\/$/, "");
        
        const res = await fetch(`${baseUrl}/transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(
                { error: data.detail || "Failed to transcribe YouTube video." },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
