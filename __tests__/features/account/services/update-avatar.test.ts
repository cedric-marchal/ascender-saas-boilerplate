import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockPrismaFindUnique = vi.fn();
const mockOptimizeAvatar = vi.fn();
const mockUploadFile = vi.fn();
const mockDeleteFile = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockAuthUpdateUser = vi.fn();
const mockHeaders = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockPrismaFindUnique,
    },
  },
}));

vi.mock("@/lib/optimize", () => ({
  optimizeAvatar: mockOptimizeAvatar,
}));

vi.mock("@/lib/r2", () => ({
  uploadFile: mockUploadFile,
  deleteFile: mockDeleteFile,
  getPublicUrl: mockGetPublicUrl,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      updateUser: mockAuthUpdateUser,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

// Import after mocks
const { updateAvatar } = await import(
  "@/features/account/services/update-avatar.service"
);

describe("updateAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
  });

  it("optimizes image via optimizeAvatar", async () => {
    const mockFile = new File(["content"], "avatar.jpg", {
      type: "image/jpeg",
    });
    mockOptimizeAvatar.mockResolvedValue({
      buffer: Buffer.from("optimized"),
      format: "webp",
      size: 1024,
    });
    mockGetPublicUrl.mockReturnValue("https://r2.test/avatars/user-123.webp");
    mockPrismaFindUnique.mockResolvedValue({ id: "user-123", image: null });

    await updateAvatar({ userId: "user-123", avatar: mockFile });

    expect(mockOptimizeAvatar).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it("uploads file to R2 with correct key", async () => {
    const mockFile = new File(["content"], "avatar.jpg");
    mockOptimizeAvatar.mockResolvedValue({
      buffer: Buffer.from("optimized"),
      format: "webp",
      size: 1024,
    });
    mockGetPublicUrl.mockReturnValue("https://r2.test/avatars/file.webp");
    mockPrismaFindUnique.mockResolvedValue({ id: "user-123", image: null });

    await updateAvatar({ userId: "user-123", avatar: mockFile });

    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/user-123-\d+\.webp$/),
      expect.any(Buffer),
      "image/webp"
    );
  });

  it("deletes old avatar if exists", async () => {
    const mockFile = new File(["content"], "avatar.jpg");
    mockOptimizeAvatar.mockResolvedValue({
      buffer: Buffer.from("optimized"),
      format: "webp",
      size: 1024,
    });
    mockGetPublicUrl.mockReturnValue("https://r2.test/avatars/new.webp");
    mockPrismaFindUnique.mockResolvedValue({
      id: "user-123",
      image: "avatars/old-avatar.webp",
    });

    await updateAvatar({ userId: "user-123", avatar: mockFile });

    expect(mockDeleteFile).toHaveBeenCalledWith("avatars/old-avatar.webp");
  });

  it("does not delete if image is null", async () => {
    const mockFile = new File(["content"], "avatar.jpg");
    mockOptimizeAvatar.mockResolvedValue({
      buffer: Buffer.from("optimized"),
      format: "webp",
      size: 1024,
    });
    mockGetPublicUrl.mockReturnValue("https://r2.test/avatars/new.webp");
    mockPrismaFindUnique.mockResolvedValue({ id: "user-123", image: null });

    await updateAvatar({ userId: "user-123", avatar: mockFile });

    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("does not delete if path does not start with avatars", async () => {
    const mockFile = new File(["content"], "avatar.jpg");
    mockOptimizeAvatar.mockResolvedValue({
      buffer: Buffer.from("optimized"),
      format: "webp",
      size: 1024,
    });
    mockGetPublicUrl.mockReturnValue("https://r2.test/avatars/new.webp");
    mockPrismaFindUnique.mockResolvedValue({
      id: "user-123",
      image: "other/path.jpg",
    });

    await updateAvatar({ userId: "user-123", avatar: mockFile });

    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("updates session via auth.api.updateUser", async () => {
    const mockFile = new File(["content"], "avatar.jpg");
    mockOptimizeAvatar.mockResolvedValue({
      buffer: Buffer.from("optimized"),
      format: "webp",
      size: 1024,
    });
    mockGetPublicUrl.mockReturnValue("https://r2.test/avatars/file.webp");
    mockPrismaFindUnique.mockResolvedValue({ id: "user-123", image: null });

    await updateAvatar({ userId: "user-123", avatar: mockFile });

    expect(mockAuthUpdateUser).toHaveBeenCalledWith({
      body: {
        image: expect.stringMatching(/^avatars\/user-123-\d+\.webp$/),
      },
      headers: expect.any(Headers),
    });
  });

  it("returns avatarUrl and size", async () => {
    const mockFile = new File(["content"], "avatar.jpg");
    mockOptimizeAvatar.mockResolvedValue({
      buffer: Buffer.from("optimized"),
      format: "webp",
      size: 2048,
    });
    mockGetPublicUrl.mockReturnValue("https://r2.test/avatars/avatar.webp");
    mockPrismaFindUnique.mockResolvedValue({ id: "user-123", image: null });

    const result = await updateAvatar({ userId: "user-123", avatar: mockFile });

    expect(result.avatarUrl).toBe("https://r2.test/avatars/avatar.webp");
    expect(result.size).toBe(2048);
  });

  it("sanitizes userId in filename", async () => {
    const mockFile = new File(["content"], "avatar.jpg");
    mockOptimizeAvatar.mockResolvedValue({
      buffer: Buffer.from("optimized"),
      format: "webp",
      size: 1024,
    });
    mockGetPublicUrl.mockReturnValue("https://r2.test/avatars/file.webp");
    mockPrismaFindUnique.mockResolvedValue({ id: "user-123", image: null });

    await updateAvatar({ userId: "user/../123", avatar: mockFile });

    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/user____123-\d+\.webp$/),
      expect.any(Buffer),
      "image/webp"
    );
  });
});
