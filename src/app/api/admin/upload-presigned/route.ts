import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { filename, contentType } = await req.json();

        const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
        if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

        const res = await fetch(`${baseUrl}/api/legal/document-upload-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, content_type: contentType }),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return NextResponse.json({ error: error.detail || "Failed to get upload URL from AI service" }, { status: res.status });
        }

        const data = await res.json();
        const cloudfrontUrl = (process.env.CLOUDFRONT_URL || "").replace(/\/$/, "");
        return NextResponse.json({
            url: data.url,
            key: data.s3_key,
            filename: data.filename,
            fileUrl: cloudfrontUrl ? `${cloudfrontUrl}/${data.s3_key}` : data.s3_key
        });
    } catch (error: any) {
        console.error("Upload Presigned URL Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
