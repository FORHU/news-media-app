import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3ClientInstance: S3Client | null = null;

function getS3Client() {
    if (!s3ClientInstance) {
        s3ClientInstance = new S3Client({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: (process.env.APP_AWS_ACCESS_KEY_ID || process.env.APP_AWS_ACCESS_KEY || "dummy_key")!,
                secretAccessKey: (process.env.APP_AWS_SECRET_ACCESS_KEY || "dummy_secret")!,
            },
        });
    }
    return s3ClientInstance;
}

/**
 * Uploads a file to AWS S3 and returns the CloudFront or S3 public URL.
 */
export async function uploadToS3(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const bucketName = process.env.AWS_S3_BUCKET!;
    const cloudfrontUrl = process.env.CLOUDFRONT_URL?.replace(/\/$/, "");

    // Generate a unique filename to prevent collisions
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
    const key = `articles/${uniqueFileName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    try {
        await getS3Client().send(command);

        if (cloudfrontUrl) {
            return `${cloudfrontUrl}/${key}`;
        }

        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error: unknown) {
        const code = error instanceof Error && "Code" in error ? (error as Error & { Code?: string }).Code : undefined;
        const name = error instanceof Error ? error.name : undefined;
        const message = error instanceof Error ? error.message : String(error);
        console.error("S3 Upload Error — code:", code ?? name, "| message:", message, "| key:", key, "| bucket:", bucketName, "| region:", process.env.AWS_REGION);
        throw new Error(`Failed to upload file to S3: [${code ?? name}] ${message}`);
    }
}

/**
 * Generates a presigned URL for direct client-side upload to S3.
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string): Promise<{ url: string; key: string }> {
    const bucketName = process.env.AWS_S3_BUCKET!;
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
    const key = `uploads/documents/${uniqueFileName}`;

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
