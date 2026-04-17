import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const contentType = file.type || "application/octet-stream";
        const fileName = file.name;

        const url = await uploadToS3(buffer, fileName, contentType);

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("Upload Route Error:", error);
        return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
    }
}
