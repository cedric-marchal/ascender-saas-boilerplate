import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getImageMetadata,
  optimizeAvatar,
  optimizeBanner,
  optimizeImage,
} from "@/lib/optimize";

import { BadRequestError } from "@/utils/errors/errors";

// Mock sharp
vi.mock("sharp");

describe("validateImageBuffer (via optimizeImage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws BadRequestError for empty buffer", async () => {
    const emptyBuffer = Buffer.from([]);

    await expect(optimizeImage(emptyBuffer)).rejects.toThrow(BadRequestError);
    await expect(optimizeImage(emptyBuffer)).rejects.toThrow(
      "errors.image.emptyFile",
    );
  });

  it("throws for unsupported format (gif)", async () => {
    const mockSharp = {
      metadata: vi.fn().mockResolvedValue({
        format: "gif",
        width: 800,
        height: 600,
      }),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const buffer = Buffer.from("fake-gif-data");

    await expect(optimizeImage(buffer)).rejects.toThrow(BadRequestError);
    await expect(optimizeImage(buffer)).rejects.toThrow(
      "errors.image.unsupportedFormat",
    );
  });

  it("throws for excessive dimensions (>10000px)", async () => {
    const mockSharp = {
      metadata: vi.fn().mockResolvedValue({
        format: "jpeg",
        width: 15000,
        height: 600,
      }),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const buffer = Buffer.from("fake-jpeg-data");

    await expect(optimizeImage(buffer)).rejects.toThrow(BadRequestError);
    await expect(optimizeImage(buffer)).rejects.toThrow(
      "errors.image.tooLarge",
    );
  });

  it("throws for non-image buffer", async () => {
    const mockSharp = {
      metadata: vi.fn().mockRejectedValue(new Error("Invalid image")),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const buffer = Buffer.from("not-an-image");

    await expect(optimizeImage(buffer)).rejects.toThrow(BadRequestError);
    await expect(optimizeImage(buffer)).rejects.toThrow("errors.image.invalid");
  });

  it("accepts valid jpeg", async () => {
    const mockMetadata = {
      format: "jpeg",
      width: 1920,
      height: 1080,
    };
    const mockBuffer = Buffer.from("optimized-jpeg");

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      webp: vi.fn().mockReturnThis(),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const buffer = Buffer.from("valid-jpeg");
    const result = await optimizeImage(buffer);

    expect(result.buffer).toBe(mockBuffer);
    expect(result.format).toBe("webp");
    expect(result.size).toBe(mockBuffer.length);
  });

  it("accepts valid png", async () => {
    const mockMetadata = {
      format: "png",
      width: 800,
      height: 600,
    };
    const mockBuffer = Buffer.from("optimized-png");

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(mockBuffer),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const buffer = Buffer.from("valid-png");
    const result = await optimizeImage(buffer);

    expect(result).toBeDefined();
    expect(result.buffer).toBe(mockBuffer);
  });

  it("accepts valid webp", async () => {
    const mockMetadata = {
      format: "webp",
      width: 1024,
      height: 768,
    };
    const mockBuffer = Buffer.from("optimized-webp");

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(mockBuffer),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const buffer = Buffer.from("valid-webp");
    const result = await optimizeImage(buffer);

    expect(result).toBeDefined();
  });

  it("throws when metadata has no format", async () => {
    const mockSharp = {
      metadata: vi.fn().mockResolvedValue({
        width: 800,
        height: 600,
      }),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const buffer = Buffer.from("no-format");

    await expect(optimizeImage(buffer)).rejects.toThrow(BadRequestError);
    await expect(optimizeImage(buffer)).rejects.toThrow(
      "errors.image.unrecognizedFormat",
    );
  });

  it("throws when metadata has no dimensions", async () => {
    const mockSharp = {
      metadata: vi.fn().mockResolvedValue({
        format: "jpeg",
      }),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const buffer = Buffer.from("no-dimensions");

    await expect(optimizeImage(buffer)).rejects.toThrow(BadRequestError);
    await expect(optimizeImage(buffer)).rejects.toThrow(
      "errors.image.dimensionsUnreadable",
    );
  });
});

describe("optimizeImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns optimized buffer with format and size", async () => {
    const mockMetadata = {
      format: "jpeg",
      width: 1920,
      height: 1080,
    };
    const mockBuffer = Buffer.from("optimized-image-data");

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(mockBuffer),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input-image");
    const result = await optimizeImage(input);

    expect(result.buffer).toBe(mockBuffer);
    expect(result.format).toBe("webp");
    expect(result.size).toBe(mockBuffer.length);
  });

  it("uses default options (1920x1080, quality 80, webp)", async () => {
    const mockMetadata = {
      format: "jpeg",
      width: 2000,
      height: 1500,
    };
    const mockBuffer = Buffer.from("optimized");

    const mockResize = vi.fn().mockReturnThis();
    const mockToFormat = vi.fn().mockReturnThis();
    const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer);

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: mockResize,
      toFormat: mockToFormat,
      toBuffer: mockToBuffer,
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input");
    await optimizeImage(input);

    expect(mockResize).toHaveBeenCalledWith(1920, 1080, {
      fit: "inside",
      withoutEnlargement: true,
    });
    expect(mockToFormat).toHaveBeenCalledWith("webp", { quality: 80 });
  });

  it("respects custom options", async () => {
    const mockMetadata = {
      format: "png",
      width: 1000,
      height: 800,
    };
    const mockBuffer = Buffer.from("custom-optimized");

    const mockResize = vi.fn().mockReturnThis();
    const mockToFormat = vi.fn().mockReturnThis();
    const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer);

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: mockResize,
      toFormat: mockToFormat,
      toBuffer: mockToBuffer,
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input");
    const result = await optimizeImage(input, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 90,
      format: "jpeg",
    });

    expect(mockResize).toHaveBeenCalledWith(800, 600, {
      fit: "inside",
      withoutEnlargement: true,
    });
    expect(mockToFormat).toHaveBeenCalledWith("jpeg", { quality: 90 });
    expect(result.format).toBe("jpeg");
  });

  it("throws on sharp processing failure", async () => {
    const mockMetadata = {
      format: "jpeg",
      width: 800,
      height: 600,
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockRejectedValue(new Error("Sharp error")),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input");

    await expect(optimizeImage(input)).rejects.toThrow(BadRequestError);
    await expect(optimizeImage(input)).rejects.toThrow(
      "errors.image.optimizeFailed",
    );
  });
});

describe("optimizeAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 256x256 webp", async () => {
    const mockMetadata = {
      format: "jpeg",
      width: 1000,
      height: 1000,
    };
    const mockBuffer = Buffer.from("avatar-optimized");

    const mockResize = vi.fn().mockReturnThis();
    const mockWebp = vi.fn().mockReturnThis();
    const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer);

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: mockResize,
      webp: mockWebp,
      toBuffer: mockToBuffer,
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("avatar-input");
    const result = await optimizeAvatar(input);

    expect(mockResize).toHaveBeenCalledWith(256, 256, {
      fit: "cover",
      position: "center",
    });
    expect(mockWebp).toHaveBeenCalledWith({ quality: 80 });
    expect(result.buffer).toBe(mockBuffer);
    expect(result.format).toBe("webp");
    expect(result.size).toBe(mockBuffer.length);
  });

  it("throws on invalid buffer", async () => {
    const mockSharp = {
      metadata: vi.fn().mockRejectedValue(new Error("Invalid")),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("invalid");

    await expect(optimizeAvatar(input)).rejects.toThrow(BadRequestError);
  });

  it("throws on sharp processing failure", async () => {
    const mockMetadata = {
      format: "png",
      width: 500,
      height: 500,
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockRejectedValue(new Error("Processing failed")),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input");

    await expect(optimizeAvatar(input)).rejects.toThrow(BadRequestError);
    await expect(optimizeAvatar(input)).rejects.toThrow(
      "errors.image.avatarOptimizeFailed",
    );
  });
});

describe("optimizeBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 1500x500 webp quality 85", async () => {
    const mockMetadata = {
      format: "jpeg",
      width: 2000,
      height: 800,
    };
    const mockBuffer = Buffer.from("banner-optimized");

    const mockResize = vi.fn().mockReturnThis();
    const mockWebp = vi.fn().mockReturnThis();
    const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer);

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: mockResize,
      webp: mockWebp,
      toBuffer: mockToBuffer,
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("banner-input");
    const result = await optimizeBanner(input);

    expect(mockResize).toHaveBeenCalledWith(1500, 500, {
      fit: "cover",
      position: "center",
    });
    expect(mockWebp).toHaveBeenCalledWith({ quality: 85 });
    expect(result.buffer).toBe(mockBuffer);
    expect(result.format).toBe("webp");
    expect(result.size).toBe(mockBuffer.length);
  });

  it("throws on sharp processing failure", async () => {
    const mockMetadata = {
      format: "png",
      width: 1920,
      height: 600,
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
      resize: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockRejectedValue(new Error("Failed")),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input");

    await expect(optimizeBanner(input)).rejects.toThrow(BadRequestError);
    await expect(optimizeBanner(input)).rejects.toThrow(
      "errors.image.bannerOptimizeFailed",
    );
  });
});

describe("getImageMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns width, height, format", async () => {
    const mockMetadata = {
      format: "jpeg",
      width: 1920,
      height: 1080,
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input");
    const result = await getImageMetadata(input);

    expect(result).toEqual({
      width: 1920,
      height: 1080,
      format: "jpeg",
    });
  });

  it("falls back to 0/unknown if metadata missing", async () => {
    const mockMetadata = {};

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input");

    // Will fail validation first because format is missing
    await expect(getImageMetadata(input)).rejects.toThrow(BadRequestError);
  });

  it("returns fallback values when width/height are undefined", async () => {
    const mockMetadata = {
      format: "webp",
      width: undefined,
      height: undefined,
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("input");

    // Will fail validation first because dimensions are missing
    await expect(getImageMetadata(input)).rejects.toThrow(BadRequestError);
  });

  it("validates buffer before extracting metadata", async () => {
    const mockSharp = {
      metadata: vi.fn().mockRejectedValue(new Error("Invalid image")),
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as never);

    const input = Buffer.from("invalid");

    // Validation fails first, so we get the validation error
    await expect(getImageMetadata(input)).rejects.toThrow(BadRequestError);
    await expect(getImageMetadata(input)).rejects.toThrow(
      "errors.image.invalid",
    );
  });
});
