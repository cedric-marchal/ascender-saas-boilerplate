import {
  BadRequestError,
  ServiceUnavailableError,
} from "@/utils/errors/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock AWS SDK before imports
const mockSend = vi.fn();
const mockGetSignedUrl = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: class {
      send = mockSend;
    },
    PutObjectCommand: class {
      constructor(public params: unknown) {}
    },
    DeleteObjectCommand: class {
      constructor(public params: unknown) {}
    },
    GetObjectCommand: class {
      constructor(public params: unknown) {}
    },
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

// Import after mocks
const { deleteFile, fileExists, getPrivateUrl, getPublicUrl, uploadFile } =
  await import("@/lib/r2");

describe("validateKey (via getPublicUrl)", () => {
  it("throws for empty key", () => {
    expect(() => getPublicUrl("")).toThrow(BadRequestError);
    expect(() => getPublicUrl("")).toThrow("La clé du fichier est requise");
  });

  it("throws for whitespace-only key", () => {
    expect(() => getPublicUrl("   ")).toThrow(BadRequestError);
    expect(() => getPublicUrl("   ")).toThrow("La clé du fichier est requise");
  });

  it("throws for key too long (>1024)", () => {
    const longKey = "a".repeat(1025);

    expect(() => getPublicUrl(longKey)).toThrow(BadRequestError);
    expect(() => getPublicUrl(longKey)).toThrow("trop longue");
  });

  it("throws for key with ..", () => {
    expect(() => getPublicUrl("path/../sensitive")).toThrow(BadRequestError);
    expect(() => getPublicUrl("path/../sensitive")).toThrow(
      "caractères invalides"
    );
  });

  it("throws for key starting with /", () => {
    expect(() => getPublicUrl("/absolute/path")).toThrow(BadRequestError);
    expect(() => getPublicUrl("/absolute/path")).toThrow(
      "caractères invalides"
    );
  });

  it("accepts valid key", () => {
    const url = getPublicUrl("avatars/user-123.webp");

    expect(url).toContain("avatars/user-123.webp");
  });
});

describe("getPublicUrl", () => {
  it("returns correct URL format", () => {
    const key = "avatars/user-123.webp";
    const url = getPublicUrl(key);

    expect(url).toMatch(/https?:\/\/.+\/avatars\/user-123\.webp/);
  });

  it("throws for invalid key", () => {
    expect(() => getPublicUrl("")).toThrow(BadRequestError);
  });
});

describe("uploadFile", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockGetSignedUrl.mockClear();
  });

  it("calls S3Client.send with PutObjectCommand", async () => {
    mockSend.mockResolvedValue({});

    const key = "test/file.txt";
    const body = Buffer.from("content");
    const contentType = "text/plain";

    await uploadFile(key, body, contentType);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    expect(call.params).toMatchObject({
      Bucket: "test-bucket",
      Key: key,
      Body: body,
      ContentType: contentType,
    });
  });

  it("throws BadRequestError for empty body", async () => {
    await expect(
      uploadFile("key", null as never, "text/plain")
    ).rejects.toThrow(BadRequestError);
    await expect(
      uploadFile("key", null as never, "text/plain")
    ).rejects.toThrow("Le contenu du fichier est requis");
  });

  it("throws BadRequestError for empty contentType", async () => {
    const body = Buffer.from("data");

    await expect(uploadFile("key", body, "")).rejects.toThrow(BadRequestError);
    await expect(uploadFile("key", body, "")).rejects.toThrow(
      "Le type de contenu est requis"
    );
  });

  it("throws BadRequestError for whitespace-only contentType", async () => {
    const body = Buffer.from("data");

    await expect(uploadFile("key", body, "   ")).rejects.toThrow(
      BadRequestError
    );
    await expect(uploadFile("key", body, "   ")).rejects.toThrow(
      "Le type de contenu est requis"
    );
  });

  it("throws ServiceUnavailableError on S3 error", async () => {
    mockSend.mockRejectedValue(new Error("S3 error"));

    const body = Buffer.from("data");

    await expect(uploadFile("key", body, "text/plain")).rejects.toThrow(
      ServiceUnavailableError
    );
    await expect(uploadFile("key", body, "text/plain")).rejects.toThrow(
      "temporairement indisponible"
    );
  });
});

describe("deleteFile", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockGetSignedUrl.mockClear();
  });

  it("calls S3Client.send with DeleteObjectCommand", async () => {
    mockSend.mockResolvedValue({});

    const key = "test/file.txt";

    await deleteFile(key);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    expect(call.params).toMatchObject({
      Bucket: "test-bucket",
      Key: key,
    });
  });

  it("throws ServiceUnavailableError on S3 error", async () => {
    mockSend.mockRejectedValue(new Error("Delete failed"));

    await expect(deleteFile("key")).rejects.toThrow(ServiceUnavailableError);
    await expect(deleteFile("key")).rejects.toThrow(
      "temporairement indisponible"
    );
  });

  it("throws for invalid key", async () => {
    await expect(deleteFile("")).rejects.toThrow(BadRequestError);
  });
});

describe("fileExists", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockGetSignedUrl.mockClear();
  });

  it("returns true if file exists", async () => {
    mockSend.mockResolvedValue({});

    const exists = await fileExists("existing-file.txt");

    expect(exists).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    expect(call.params).toMatchObject({
      Bucket: "test-bucket",
      Key: "existing-file.txt",
    });
  });

  it("returns false if file does not exist (error)", async () => {
    mockSend.mockRejectedValue(new Error("NoSuchKey"));

    const exists = await fileExists("non-existent.txt");

    expect(exists).toBe(false);
  });

  it("throws for invalid key", async () => {
    await expect(fileExists("")).rejects.toThrow(BadRequestError);
  });
});

describe("getPrivateUrl", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockGetSignedUrl.mockClear();
  });

  it("returns signed URL", async () => {
    const mockUrl = "https://signed-url.example.com/file?signature=abc123";
    mockGetSignedUrl.mockResolvedValue(mockUrl);

    const url = await getPrivateUrl("private/file.pdf");

    expect(url).toBe(mockUrl);
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("uses default expiresIn (3600)", async () => {
    const mockUrl = "https://signed.example.com";
    mockGetSignedUrl.mockResolvedValue(mockUrl);

    await getPrivateUrl("file.txt");

    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    const call = mockGetSignedUrl.mock.calls[0];
    expect(call?.[1]).toBeDefined();
    expect(call?.[1].params).toMatchObject({
      Bucket: "test-bucket",
      Key: "file.txt",
    });
    expect(call?.[2]).toEqual({ expiresIn: 3600 });
  });

  it("throws for expiresIn < 60", async () => {
    await expect(getPrivateUrl("file.txt", 30)).rejects.toThrow(
      BadRequestError
    );
    await expect(getPrivateUrl("file.txt", 30)).rejects.toThrow(
      "durée d'expiration"
    );
  });

  it("throws for expiresIn > 604800", async () => {
    await expect(getPrivateUrl("file.txt", 700000)).rejects.toThrow(
      BadRequestError
    );
    await expect(getPrivateUrl("file.txt", 700000)).rejects.toThrow(
      "durée d'expiration"
    );
  });

  it("accepts valid expiresIn", async () => {
    const mockUrl = "https://signed.example.com";
    mockGetSignedUrl.mockResolvedValue(mockUrl);

    const url = await getPrivateUrl("file.txt", 600);

    expect(url).toBe(mockUrl);
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    const call = mockGetSignedUrl.mock.calls[0];
    expect(call?.[1]).toBeDefined();
    expect(call?.[1].params).toMatchObject({
      Bucket: "test-bucket",
      Key: "file.txt",
    });
    expect(call?.[2]).toEqual({ expiresIn: 600 });
  });

  it("throws ServiceUnavailableError on signing error", async () => {
    mockGetSignedUrl.mockRejectedValue(new Error("Signing failed"));

    await expect(getPrivateUrl("file.txt")).rejects.toThrow(
      ServiceUnavailableError
    );
    await expect(getPrivateUrl("file.txt")).rejects.toThrow(
      "temporairement indisponible"
    );
  });

  it("throws for invalid key", async () => {
    await expect(getPrivateUrl("")).rejects.toThrow(BadRequestError);
  });
});
