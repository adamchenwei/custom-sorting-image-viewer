import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_RAW = process.env.S3_BUCKET_RAW || 'custom-sorting-images-raw';
const BUCKET_PROCESSED = process.env.S3_BUCKET_PROCESSED || 'custom-sorting-images-processed';

export interface UploadUrlOptions {
  filename: string;
  contentType?: string;
  expiresInSeconds?: number;
  deviceId?: string;
}

export async function generateUploadUrl({
  filename,
  contentType = 'image/webp',
  expiresInSeconds = 300,
  deviceId = 'default',
}: UploadUrlOptions): Promise<string> {
  const key = `${deviceId}/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_RAW,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function uploadToProcessedBucket(
  key: string,
  body: Buffer,
  contentType: string = 'image/webp'
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_PROCESSED,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

export async function listProcessedImages(prefix?: string, maxKeys = 100): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_PROCESSED,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await s3Client.send(command);
  return response.Contents?.map((item) => item.Key || '') || [];
}

export async function deleteFromProcessedBucket(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_PROCESSED,
    Key: key,
  });

  await s3Client.send(command);
}

export { s3Client, BUCKET_RAW, BUCKET_PROCESSED };
