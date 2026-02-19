import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  },
}));

// Import after mocks
const { UpdateAvatarSchema } = await import(
  "@/features/account/schemas/avatar.schema"
);

describe("UpdateAvatarSchema", () => {
  describe("accepts valid files", () => {
    it("accepts valid JPEG file", () => {
      const validJpeg = new File(["valid content"], "avatar.jpg", {
        type: "image/jpeg",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: validJpeg });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatar).toBe(validJpeg);
      }
    });

    it("accepts valid PNG file", () => {
      const validPng = new File(["valid content"], "avatar.png", {
        type: "image/png",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: validPng });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatar).toBe(validPng);
      }
    });

    it("accepts valid WebP file", () => {
      const validWebp = new File(["valid content"], "avatar.webp", {
        type: "image/webp",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: validWebp });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatar).toBe(validWebp);
      }
    });

    it("accepts file at maximum size", () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const content = new Uint8Array(maxSize);
      const largeFile = new File([content], "large.jpg", {
        type: "image/jpeg",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: largeFile });

      expect(result.success).toBe(true);
    });
  });

  describe("rejects empty files", () => {
    it("rejects file with size 0", () => {
      const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });

      const result = UpdateAvatarSchema.safeParse({ avatar: emptyFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("L'image est requise");
      }
    });

    it("rejects file with empty buffer", () => {
      const emptyFile = new File([""], "empty.png", { type: "image/png" });

      const result = UpdateAvatarSchema.safeParse({ avatar: emptyFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("image est requise");
      }
    });
  });

  describe("rejects files that are too large", () => {
    it("rejects file larger than MAX_FILE_SIZE", () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const oversizedContent = new Uint8Array(maxSize + 1);
      const oversizedFile = new File([oversizedContent], "huge.jpg", {
        type: "image/jpeg",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: oversizedFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("trop volumineuse");
        expect(result.error.issues[0]?.message).toContain("5MB");
      }
    });

    it("rejects file significantly larger than limit", () => {
      const oversizedContent = new Uint8Array(10 * 1024 * 1024); // 10MB
      const oversizedFile = new File([oversizedContent], "very-large.png", {
        type: "image/png",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: oversizedFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("volumineuse");
      }
    });
  });

  describe("rejects unsupported file formats", () => {
    it("rejects GIF file", () => {
      const gifFile = new File(["content"], "avatar.gif", {
        type: "image/gif",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: gifFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Format non supporté. Formats acceptés : JPEG, PNG, WebP"
        );
      }
    });

    it("rejects PDF file", () => {
      const pdfFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: pdfFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Format non supporté");
        expect(result.error.issues[0]?.message).toContain("JPEG, PNG, WebP");
      }
    });

    it("rejects SVG file", () => {
      const svgFile = new File(["<svg></svg>"], "icon.svg", {
        type: "image/svg+xml",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: svgFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Format non supporté");
      }
    });

    it("rejects BMP file", () => {
      const bmpFile = new File(["content"], "image.bmp", {
        type: "image/bmp",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: bmpFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Format non supporté");
      }
    });

    it("rejects TIFF file", () => {
      const tiffFile = new File(["content"], "photo.tiff", {
        type: "image/tiff",
      });

      const result = UpdateAvatarSchema.safeParse({ avatar: tiffFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Format non supporté");
      }
    });

    it("rejects file with no type", () => {
      const noTypeFile = new File(["content"], "unknown.file");

      const result = UpdateAvatarSchema.safeParse({ avatar: noTypeFile });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Format non supporté");
      }
    });
  });

  describe("rejects non-File inputs", () => {
    it("rejects string input", () => {
      const result = UpdateAvatarSchema.safeParse({
        avatar: "not-a-file.jpg",
      });

      expect(result.success).toBe(false);
    });

    it("rejects object input", () => {
      const result = UpdateAvatarSchema.safeParse({
        avatar: { name: "file.jpg", type: "image/jpeg" },
      });

      expect(result.success).toBe(false);
    });

    it("rejects null input", () => {
      const result = UpdateAvatarSchema.safeParse({ avatar: null });

      expect(result.success).toBe(false);
    });

    it("rejects undefined input", () => {
      const result = UpdateAvatarSchema.safeParse({ avatar: undefined });

      expect(result.success).toBe(false);
    });

    it("rejects number input", () => {
      const result = UpdateAvatarSchema.safeParse({ avatar: 12345 });

      expect(result.success).toBe(false);
    });

    it("rejects Blob input (not File)", () => {
      const blob = new Blob(["content"], { type: "image/jpeg" });

      const result = UpdateAvatarSchema.safeParse({ avatar: blob });

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("rejects missing avatar field", () => {
      const result = UpdateAvatarSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("accepts file with exactly 1 byte", () => {
      const tinyFile = new File(["x"], "tiny.jpg", { type: "image/jpeg" });

      const result = UpdateAvatarSchema.safeParse({ avatar: tinyFile });

      expect(result.success).toBe(true);
    });
  });
});
