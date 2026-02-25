import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockGetSession = vi.fn();
const mockCheckRatelimit = vi.fn();
const mockUpdateAvatar = vi.fn();
const mockHandleApiError = vi.fn();

vi.mock("@/lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/utils/ratelimit/check-ratelimit", () => ({
  checkRatelimit: mockCheckRatelimit,
}));

vi.mock("@/features/account/services/update-avatar.service", () => ({
  updateAvatar: mockUpdateAvatar,
}));

vi.mock("@/utils/errors/handle-api-error", () => ({
  handleApiError: mockHandleApiError,
}));

vi.mock("@/lib/ratelimit", () => ({
  authenticatedRatelimit: { limit: 10 },
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  },
}));

// Import after mocks
const { POST } = await import("@/app/api/avatar/route");

describe("POST /api/avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset handleApiError to default behavior
    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    });
  });

  it("returns 401 if no session", async () => {
    mockGetSession.mockResolvedValue(null);

    const formData = new FormData();
    const mockFile = new File(["content"], "avatar.jpg", {
      type: "image/jpeg",
    });
    formData.append("avatar", mockFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 401 },
      );
    });

    const response = await POST(mockRequest);
    const data = await response.json() as { success: boolean };

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockCheckRatelimit).not.toHaveBeenCalled();
    expect(mockUpdateAvatar).not.toHaveBeenCalled();
  });

  it("checks rate limit with session.user.id", async () => {
    const userId = "user-123";
    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "user@example.com" },
    });

    const formData = new FormData();
    const mockFile = new File(["content"], "avatar.jpg", {
      type: "image/jpeg",
    });
    formData.append("avatar", mockFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCheckRatelimit.mockResolvedValue(undefined);
    mockUpdateAvatar.mockResolvedValue({
      avatarUrl: "https://r2.test/avatars/user-123.webp",
      size: 1024,
    });

    await POST(mockRequest);

    expect(mockCheckRatelimit).toHaveBeenCalledWith({ limit: 10 }, userId);
  });

  it("parses formData and validates with Zod", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const mockFile = new File(["content"], "avatar.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("avatar", mockFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCheckRatelimit.mockResolvedValue(undefined);
    mockUpdateAvatar.mockResolvedValue({
      avatarUrl: "https://r2.test/avatars/avatar.webp",
      size: 2048,
    });

    await POST(mockRequest);

    expect(mockUpdateAvatar).toHaveBeenCalledWith({
      userId: "user-123",
      avatar: mockFile,
    });
  });

  it("returns 201 with result on success", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    const mockFile = new File(["content"], "avatar.jpg", {
      type: "image/jpeg",
    });
    formData.append("avatar", mockFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const expectedResult = {
      avatarUrl: "https://r2.test/avatars/user-123-1234567890.webp",
      size: 3072,
    };

    mockCheckRatelimit.mockResolvedValue(undefined);
    mockUpdateAvatar.mockResolvedValue(expectedResult);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      success: true,
      data: expectedResult,
    });
  });

  it("calls handleApiError on Zod validation error", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    // Missing avatar file

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCheckRatelimit.mockResolvedValue(undefined);
    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: "Validation failed" },
        { status: 400 },
      );
    });

    const response = await POST(mockRequest);

    expect(mockHandleApiError).toHaveBeenCalled();
    expect(mockUpdateAvatar).not.toHaveBeenCalled();
  });

  it("calls handleApiError on rate limit error", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    const mockFile = new File(["content"], "avatar.jpg", {
      type: "image/jpeg",
    });
    formData.append("avatar", mockFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCheckRatelimit.mockRejectedValue(new Error("Rate limit exceeded"));
    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 429 },
      );
    });

    const response = await POST(mockRequest);

    expect(mockHandleApiError).toHaveBeenCalled();
    expect(mockUpdateAvatar).not.toHaveBeenCalled();
    expect(response.status).toBe(429);
  });

  it("calls handleApiError when updateAvatar throws", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    const mockFile = new File(["content"], "avatar.jpg", {
      type: "image/jpeg",
    });
    formData.append("avatar", mockFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCheckRatelimit.mockResolvedValue(undefined);
    mockUpdateAvatar.mockRejectedValue(new Error("R2 upload failed"));
    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    });

    const response = await POST(mockRequest);

    expect(mockHandleApiError).toHaveBeenCalled();
    expect(response.status).toBe(500);
  });

  it("validates avatar is a File object", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    formData.append("avatar", "not-a-file"); // Invalid: string instead of File

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCheckRatelimit.mockResolvedValue(undefined);
    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: "Validation failed" },
        { status: 400 },
      );
    });

    const response = await POST(mockRequest);

    expect(mockHandleApiError).toHaveBeenCalled();
    expect(mockUpdateAvatar).not.toHaveBeenCalled();
  });
});
