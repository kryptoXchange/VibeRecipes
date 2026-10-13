import { PutObjectCommand, CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET ?? "cooking";
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? "http://localhost:8333",
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY ?? "any", secretAccessKey: process.env.S3_SECRET_KEY ?? "any" },
});

export const publicUrl = (key: string) =>
  `${process.env.S3_PUBLIC_URL ?? `http://localhost:8333/${bucket}`}/${key}`;

export async function putObject(key: string, body: Buffer, contentType: string) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}
