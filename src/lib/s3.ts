import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { env, requireEnv } from "@/lib/env";

let s3ClientInstance: S3Client | null = null;

function getS3Client() {
    if (!s3ClientInstance) {
        const accessKeyId = env.APP_AWS_ACCESS_KEY_ID || env.APP_AWS_ACCESS_KEY;
        const secretAccessKey = env.APP_AWS_SECRET_ACCESS_KEY;

        s3ClientInstance = new S3Client({
            region: requireEnv("AWS_REGION"),
            // When static keys aren't provided, omit `credentials` entirely so the
            // AWS SDK's default provider chain applies (EC2/ECS instance role,
            // shared config, web identity, etc.) — this is how production runs
            // without long-lived secrets.
            ...(accessKeyId && secretAccessKey
                ? { credentials: { accessKeyId, secretAccessKey } }
                : {}),
        });
    }
    return s3ClientInstance;
}

/**
 * Strips characters that don't belong in an S3 key or a download filename and
 * caps the length. Always returns a non-empty string.
 */
function sanitizeFilename(name: string): string {
    const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
    return base || "file";
}

/**
 * Builds an S3 key as `<prefix>/<uuid>-<sanitized original name>`. The UUID
 * prevents collisions; the readable suffix keeps downloads sane.
 */
export function buildObjectKey(prefix: string, originalName: string): string {
    const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
    return `${cleanPrefix}/${randomUUID()}-${sanitizeFilename(originalName)}`;
}

/** Generated or edited article image. */
export const buildArticleImageKey = (originalName: string) =>
    buildObjectKey("article-images", originalName);

/** An article's source / material file. */
export const buildArticleKey = (originalName: string) =>
    buildObjectKey("articles", originalName);

/** A client-uploaded document (used with presigned PUT). */
export const buildDocumentUploadKey = (originalName: string) =>
    buildObjectKey("uploads/documents", originalName);

/**
 * Builds the public URL for an S3 object key, preferring CloudFront when configured.
 */
export function buildPublicUrl(key: string): string {
    const bucketName = requireEnv("AWS_S3_BUCKET");
    if (env.CLOUDFRONT_URL) {
        return `${env.CLOUDFRONT_URL}/${key}`;
    }
    return `https://${bucketName}.s3.${requireEnv("AWS_REGION")}.amazonaws.com/${key}`;
}

/**
 * Recovers the S3 key from a URL produced by `buildPublicUrl`. Returns null when
 * the URL doesn't belong to our CloudFront distribution or bucket.
 */
export function keyFromPublicUrl(url: string): string | null {
    const bases = [
        env.CLOUDFRONT_URL,
        env.AWS_S3_BUCKET && env.AWS_REGION
            ? `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`
            : undefined,
    ].filter(Boolean) as string[];

    for (const base of bases) {
        if (url.startsWith(`${base}/`)) {
            return url.slice(base.length + 1).split("?")[0];
        }
    }
    return null;
}

/**
 * Uploads a buffer to S3 at the given key and returns its public URL.
 */
export async function putObject(
    key: string,
    body: Buffer,
    contentType: string
): Promise<string> {
    const bucketName = requireEnv("AWS_S3_BUCKET");

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    try {
        await getS3Client().send(command);
        return buildPublicUrl(key);
    } catch (error: unknown) {
        const code = error instanceof Error && "Code" in error ? (error as Error & { Code?: string }).Code : undefined;
        const name = error instanceof Error ? error.name : undefined;
        const message = error instanceof Error ? error.message : String(error);
        console.error("S3 Upload Error — code:", code ?? name, "| message:", message, "| key:", key, "| bucket:", bucketName, "| region:", env.AWS_REGION);
        throw new Error(`Failed to upload file to S3: [${code ?? name}] ${message}`);
    }
}

/**
 * Uploads a file to AWS S3 under `articles/` and returns the CloudFront or S3 public URL.
 */
export async function uploadToS3(file: Buffer, fileName: string, contentType: string): Promise<string> {
    return putObject(buildArticleKey(fileName), file, contentType);
}

/**
 * Deletes a single object. Throws on failure.
 */
export async function deleteObject(key: string): Promise<void> {
    const bucketName = requireEnv("AWS_S3_BUCKET");
    await getS3Client().send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: key })
    );
}

/**
 * Best-effort bulk delete — failures are logged and swallowed so one missing
 * object never aborts a cleanup pass. Accepts raw keys or public URLs; entries
 * that don't resolve to a key in our bucket are skipped.
 */
export async function deleteObjects(keysOrUrls: string[]): Promise<void> {
    await Promise.all(
        keysOrUrls.map(async (entry) => {
            const key = entry.startsWith("http") ? keyFromPublicUrl(entry) : entry;
            if (!key) return;
            try {
                await deleteObject(key);
            } catch (error) {
                console.error(
                    "S3 Delete Error — key:",
                    key,
                    "|",
                    error instanceof Error ? error.message : String(error)
                );
            }
        })
    );
}

/**
 * Generates a presigned URL for direct client-side upload to S3.
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string): Promise<{ url: string; key: string }> {
    const bucketName = requireEnv("AWS_S3_BUCKET");
    const key = buildDocumentUploadKey(fileName);

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    try {
        const url = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
        return { url, key };
    } catch (error) {
        console.error("Presigned URL Error:", error);
        throw new Error("Failed to generate presigned URL");
    }
}
