import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

import { BadRequestError } from "@/utils/errors/errors";

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
    throw new BadRequestError("La clé du fichier est requise");
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw new BadRequestError(
      `La clé du fichier est trop longue (max ${MAX_KEY_LENGTH} caractères)`
    );
  }

  if (key.includes("..") || key.startsWith("/")) {
    throw new BadRequestError(
      "La clé du fichier contient des caractères invalides"
    );
  }
}

function validateExpiresIn(expiresIn: number): void {
  if (expiresIn < MIN_EXPIRES_IN || expiresIn > MAX_EXPIRES_IN) {
    throw new BadRequestError(
      `La durée d'expiration doit être entre ${MIN_EXPIRES_IN} et ${MAX_EXPIRES_IN} secondes`
    );
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
  contentType: string
): Promise<void> {
  validateKey(key);

  if (!body) {
    throw new BadRequestError("Le contenu du fichier est requis");
  }

  if (!contentType || contentType.trim().length === 0) {
    throw new BadRequestError("Le type de contenu est requis");
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  } catch (error: unknown) {
    throw new BadRequestError("Échec de l'upload du fichier vers le stockage");
  }
}

async function deleteFile(key: string): Promise<void> {
  validateKey(key);

  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  } catch (error: unknown) {
    throw new BadRequestError("Échec de la suppression du fichier");
  }
}

async function fileExists(key: string): Promise<boolean> {
  validateKey(key);

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

async function getPrivateUrl(
  key: string,
  expiresIn: number = 3600
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
      { expiresIn }
    );

    return url;
  } catch (error: unknown) {
    throw new BadRequestError(
      "Échec de la génération de l'URL de téléchargement"
    );
  }
}

export { deleteFile, fileExists, getPrivateUrl, getPublicUrl, uploadFile };
