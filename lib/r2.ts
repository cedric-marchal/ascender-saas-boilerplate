import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

import {
  BadRequestError,
  ServiceUnavailableError,
} from "@/utils/errors/errors";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;
const MAX_KEY_LENGTH = 1024;
const MIN_EXPIRES_IN = 60;
const MAX_EXPIRES_IN = 604800;

function validateKey(key: string): void {
  if (!key || key.trim().length === 0) {
    throw new BadRequestError("errors.storage.keyRequired");
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw new BadRequestError("errors.storage.keyTooLong", {
      params: { maxLength: MAX_KEY_LENGTH },
    });
  }

  if (key.includes("..") || key.startsWith("/")) {
    throw new BadRequestError("errors.storage.invalidKey");
  }
}

function validateExpiresIn(expiresIn: number): void {
  if (expiresIn < MIN_EXPIRES_IN || expiresIn > MAX_EXPIRES_IN) {
    throw new BadRequestError("errors.storage.invalidExpiresIn", {
      params: { min: MIN_EXPIRES_IN, max: MAX_EXPIRES_IN },
    });
  }
}

function getPublicUrl(key: string): string {
  validateKey(key);

  const baseUrl = env.NEXT_PUBLIC_R2_PUBLIC_URL;

  return `${baseUrl}/${key}`;
}

async function uploadFile(
  key: string,
  body: Buffer | Blob,
  contentType: string,
): Promise<void> {
  validateKey(key);

  if (!body) {
    throw new BadRequestError("errors.storage.contentRequired");
  }

  if (!contentType || contentType.trim().length === 0) {
    throw new BadRequestError("errors.storage.contentTypeRequired");
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (error: unknown) {
    console.error("R2 upload error:", error);
    throw new ServiceUnavailableError("errors.storage.serviceUnavailable");
  }
}

async function deleteFile(key: string): Promise<void> {
  validateKey(key);

  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  } catch (error: unknown) {
    console.error("R2 delete error:", error);
    throw new ServiceUnavailableError("errors.storage.serviceUnavailable");
  }
}

async function fileExists(key: string): Promise<boolean> {
  validateKey(key);

  try {
    await r2.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

async function getPrivateUrl(
  key: string,
  expiresIn: number = 3600,
): Promise<string> {
  validateKey(key);
  validateExpiresIn(expiresIn);

  try {
    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
      { expiresIn },
    );

    return url;
  } catch (error: unknown) {
    console.error("R2 signed URL error:", error);
    throw new ServiceUnavailableError("errors.storage.serviceUnavailable");
  }
}

export { deleteFile, fileExists, getPrivateUrl, getPublicUrl, uploadFile };
