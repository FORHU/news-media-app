import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { filename, contentType } = await req.json();

        // Generate presigned URL locally using newsicons-dev bucket
        const { url, key } = await getPresignedUploadUrl(filename, contentType);

        const cloudfrontUrl = (process.env.CLOUDFRONT_URL || "").replace(/\/$/, "");
        
        return NextResponse.json({
            url: url,
            key: key,
            filename: filename,
            fileUrl: cloudfrontUrl ? `${cloudfrontUrl}/${key}` : key
        });
    } catch (error: any) {
        console.error("Upload Presigned URL Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
