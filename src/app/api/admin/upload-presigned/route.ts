import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { filename, contentType } = await req.json();

        const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
        if (!baseUrl) throw new Error("GENERATE_CONTENT_API is not configured");

        const response = await fetch(`${baseUrl}/api/legal/document-upload-url`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                filename,
                content_type: contentType
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to get presigned URL from API: ${response.status}`);
        }

        const data = await response.json();

        // Use the bare URL (no query params) as the public URL
        const parsedUrl = new URL(data.url);
        const fileUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;

        return NextResponse.json({
            url: data.url,
            key: data.s3_key,
            filename: filename,
            fileUrl: fileUrl
        });
    } catch (error: any) {
        console.error("Upload Presigned URL Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
