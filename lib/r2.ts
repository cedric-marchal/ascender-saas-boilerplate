import "server-only";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;

/**
 * Upload un fichier vers R2
 */
async function uploadFile(
  key: string,
  body: Buffer | Blob,
  contentType: string
): Promise<boolean> {
  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Télécharge un fichier depuis R2
 */
async function downloadFile(key: string): Promise<Buffer | null> {
  try {
    const response = await r2.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );

    if (!response.Body) {
      return null;
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}

/**
 * Supprime un fichier de R2
 */
async function deleteFile(key: string): Promise<boolean> {
  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Génère une URL présignée pour upload direct (client → R2)
 */
async function getUploadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const url = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
      { expiresIn }
    );
    return url;
  } catch {
    return null;
  }
}

/**
 * Génère une URL présignée pour téléchargement (client ← R2)
 */
async function getDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
      { expiresIn }
    );
    return url;
  } catch {
    return null;
  }
}

/**
 * Vérifie si un fichier existe
 */
async function fileExists(key: string): Promise<boolean> {
  try {
    await r2.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export {
  uploadFile,
  downloadFile,
  deleteFile,
  getUploadUrl,
  getDownloadUrl,
  fileExists,
};
