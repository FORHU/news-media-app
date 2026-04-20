import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
    },
});

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
        await s3Client.send(command);

        if (cloudfrontUrl) {
            return `${cloudfrontUrl}/${key}`;
        }

        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw new Error("Failed to upload file to S3");
    }
}
