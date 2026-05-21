import { uploadToS3 } from "@/lib/s3";

export async function uploadPngBufferToSupabase(
  buffer: Buffer,
  tenantId: string,
  subfolder: string
): Promise<string> {
  const filename = `${subfolder}-${tenantId}-${Date.now()}.png`;
  return uploadToS3(buffer, filename, "image/png");
}
