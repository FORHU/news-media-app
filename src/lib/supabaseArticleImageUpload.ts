import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Upload a PNG buffer to the public articles bucket (same pattern as createFromUpload).
 */
export async function uploadPngBufferToSupabase(
  buffer: Buffer,
  tenantId: string,
  subfolder: string
): Promise<string> {
  const bucket = process.env.SUPABASE_ARTICLES_BUCKET || "articles";
  const path = `article-images/${subfolder}/${tenantId}/${Date.now()}-${randomUUID()}.png`;

  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType: "image/png",
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase image upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Supabase image upload succeeded, but public URL is missing.");
  }

  return data.publicUrl;
}
