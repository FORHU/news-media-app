import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: (process.env.APP_AWS_ACCESS_KEY_ID || process.env.APP_AWS_ACCESS_KEY || "")!,
      secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    const bucket = process.env.AWS_S3_BUCKET!;
    const cloudfrontUrl = process.env.CLOUDFRONT_URL?.replace(/\/$/, "");
    const ext = filename.split(".").pop() ?? "jpg";
    const key = `article-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const presignedUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });

    const publicUrl = cloudfrontUrl
      ? `${cloudfrontUrl}/${key}`
      : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ presignedUrl, publicUrl });
  } catch (error: any) {
    console.error("[upload-image-presigned] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate presigned URL" }, { status: 500 });
  }
}
