import "server-only";

import sharp from "sharp";

import { BadRequestError } from "@/utils/errors/errors";

const ACCEPTED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_WIDTH = 10000;
const MAX_IMAGE_HEIGHT = 10000;

type ImageFormat = "webp" | "avif" | "jpeg" | "png";

type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: ImageFormat;
};

type OptimizeImageResult = {
  buffer: Buffer;
  format: ImageFormat;
  size: number;
};

type ImageMetadata = {
  width: number;
  height: number;
  format: string;
};

async function validateImageBuffer(input: Buffer): Promise<void> {
  if (!input || input.length === 0) {
    throw new BadRequestError("Le fichier image est vide");
  }

  try {
    const metadata = await sharp(input).metadata();

    if (!metadata.format) {
      throw new BadRequestError("Format d'image non reconnu");
    }

    const mimeType = `image/${metadata.format}`;

    if (!ACCEPTED_IMAGE_FORMATS.includes(mimeType)) {
      throw new BadRequestError(
        "Format d'image non supporté. Formats acceptés : JPEG, PNG, WebP",
      );
    }

    if (!metadata.width || !metadata.height) {
      throw new BadRequestError("Impossible de lire les dimensions de l'image");
    }

    if (
      metadata.width > MAX_IMAGE_WIDTH ||
      metadata.height > MAX_IMAGE_HEIGHT
    ) {
      throw new BadRequestError(
        `L'image est trop grande (max ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px)`,
      );
    }
  } catch (error: unknown) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    throw new BadRequestError("Le fichier fourni n'est pas une image valide");
  }
}

async function optimizeImage(
  input: Buffer,
  options: OptimizeImageOptions = {},
): Promise<OptimizeImageResult> {
  await validateImageBuffer(input);

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
      buffer,
      format,
      size: buffer.length,
    };
  } catch (error: unknown) {
    throw new BadRequestError("Échec de l'optimisation de l'image", { cause: error });
  }
}

async function optimizeAvatar(input: Buffer): Promise<OptimizeImageResult> {
  await validateImageBuffer(input);

  try {
    const buffer = await sharp(input)
      .resize(256, 256, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      buffer,
      format: "webp",
      size: buffer.length,
    };
  } catch (error: unknown) {
    throw new BadRequestError("Échec de l'optimisation de l'avatar", { cause: error });
  }
}

async function optimizeBanner(input: Buffer): Promise<OptimizeImageResult> {
  await validateImageBuffer(input);

  try {
    const buffer = await sharp(input)
      .resize(1500, 500, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85 })
      .toBuffer();

    return {
      buffer,
      format: "webp",
      size: buffer.length,
    };
  } catch (error: unknown) {
    throw new BadRequestError("Échec de l'optimisation de la bannière", { cause: error });
  }
}

async function getImageMetadata(input: Buffer): Promise<ImageMetadata> {
  await validateImageBuffer(input);

  try {
    const metadata = await sharp(input).metadata();

    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? "unknown",
    };
  } catch (error: unknown) {
    throw new BadRequestError("Impossible de lire les métadonnées de l'image", { cause: error });
  }
}

export { getImageMetadata, optimizeAvatar, optimizeBanner, optimizeImage };
export type {
  ImageFormat,
  ImageMetadata,
  OptimizeImageOptions,
  OptimizeImageResult,
};
