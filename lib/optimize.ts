import "server-only";
import sharp from "sharp";

type ImageFormat = "webp" | "avif" | "jpeg" | "png";

type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: ImageFormat;
};

type OptimizeImageResult =
  | { success: true; buffer: Buffer; format: ImageFormat; size: number }
  | { success: false };

/**
 * Optimise une image (resize + compression + conversion)
 */
async function optimizeImage(
  input: Buffer,
  options: OptimizeImageOptions = {}
): Promise<OptimizeImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 80,
    format = "webp",
  } = options;

  try {
    const buffer = await sharp(input)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toBuffer();

    return {
      success: true,
      buffer,
      format,
      size: buffer.length,
    };
  } catch {
    return { success: false };
  }
}

/**
 * Optimise un avatar (carré 256x256, WebP)
 */
async function optimizeAvatar(input: Buffer): Promise<OptimizeImageResult> {
  try {
    const buffer = await sharp(input)
      .resize(256, 256, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      success: true,
      buffer,
      format: "webp",
      size: buffer.length,
    };
  } catch {
    return { success: false };
  }
}

/**
 * Optimise une bannière (1500x500, WebP)
 */
async function optimizeBanner(input: Buffer): Promise<OptimizeImageResult> {
  try {
    const buffer = await sharp(input)
      .resize(1500, 500, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85 })
      .toBuffer();

    return {
      success: true,
      buffer,
      format: "webp",
      size: buffer.length,
    };
  } catch {
    return { success: false };
  }
}

/**
 * Récupère les métadonnées d'une image
 */
async function getImageMetadata(input: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
} | null> {
  try {
    const metadata = await sharp(input).metadata();
    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? "unknown",
    };
  } catch {
    return null;
  }
}

export { optimizeImage, optimizeAvatar, optimizeBanner, getImageMetadata };
export type { OptimizeImageOptions, OptimizeImageResult, ImageFormat };
