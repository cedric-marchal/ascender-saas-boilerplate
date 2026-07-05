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
    throw new BadRequestError("errors.image.emptyFile");
  }

  try {
    const metadata = await sharp(input).metadata();

    if (!metadata.format) {
      throw new BadRequestError("errors.image.unrecognizedFormat");
    }

    const mimeType = `image/${metadata.format}`;

    if (!ACCEPTED_IMAGE_FORMATS.includes(mimeType)) {
      throw new BadRequestError("errors.image.unsupportedFormat");
    }

    if (!metadata.width || !metadata.height) {
      throw new BadRequestError("errors.image.dimensionsUnreadable");
    }

    if (
      metadata.width > MAX_IMAGE_WIDTH ||
      metadata.height > MAX_IMAGE_HEIGHT
    ) {
      throw new BadRequestError("errors.image.tooLarge", {
        params: { maxWidth: MAX_IMAGE_WIDTH, maxHeight: MAX_IMAGE_HEIGHT },
      });
    }
  } catch (error: unknown) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    throw new BadRequestError("errors.image.invalid");
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
    throw new BadRequestError("errors.image.optimizeFailed", {
      cause: error,
    });
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
    throw new BadRequestError("errors.image.avatarOptimizeFailed", {
      cause: error,
    });
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
    throw new BadRequestError("errors.image.bannerOptimizeFailed", {
      cause: error,
    });
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
    throw new BadRequestError("errors.image.metadataUnreadable", {
      cause: error,
    });
  }
}

export { getImageMetadata, optimizeAvatar, optimizeBanner, optimizeImage };
export type {
  ImageFormat,
  ImageMetadata,
  OptimizeImageOptions,
  OptimizeImageResult,
};
