import { NextRequest, NextResponse } from "next/server";
import { buildArticleImageKey, putObject } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await putObject(
      buildArticleImageKey(file.name),
      buffer,
      file.type
    );

    return NextResponse.json({ publicUrl });
  } catch (error: unknown) {
    console.error("[upload-image-presigned] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
