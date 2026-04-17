import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { s3_key, filename, session_id } = await req.json();

        const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
        if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

        const res = await fetch(`${baseUrl}/api/legal/analyze-document`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ s3_key, filename, session_id }),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return NextResponse.json({ error: error.detail || "Analysis failed" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Analyze Document Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
