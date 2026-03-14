import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSessionDeleteMany = vi.fn();
const mockVerificationDeleteMany = vi.fn();
const mockTransaction = vi.fn();
const mockHandleApiError = vi.fn();

const CRON_SECRET = "test-cron-secret-value";

vi.mock("@/lib/env", () => ({
  env: {
    CRON_SECRET,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mockTransaction,
    session: { deleteMany: mockSessionDeleteMany },
    verification: { deleteMany: mockVerificationDeleteMany },
  },
}));

vi.mock("@/utils/errors/handle-api-error", () => ({
  handleApiError: mockHandleApiError,
}));

const { GET } = await import("@/app/api/cron/cleanup/route");

function makeRequest(authorizationHeader: string | null = null): Request {
  return {
    headers: {
      get: vi.fn().mockReturnValue(authorizationHeader),
    },
  } as unknown as Request;
}

describe("GET /api/cron/cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no authorization header", async () => {
    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 401 },
      );
    });

    const response = await GET(makeRequest(null));
    const data = (await response.json()) as { success: boolean };

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 401 if authorization header is wrong", async () => {
    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 401 },
      );
    });

    const response = await GET(makeRequest("Bearer wrong-secret"));
    const data = (await response.json()) as { success: boolean };

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 200 with deleted counts on success", async () => {
    mockSessionDeleteMany.mockResolvedValue({ count: 5 });
    mockVerificationDeleteMany.mockResolvedValue({ count: 3 });
    mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );

    const response = await GET(makeRequest(`Bearer ${CRON_SECRET}`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: { deletedSessions: 5, deletedVerifications: 3 },
    });
  });

  it("calls session.deleteMany with expiresAt filter", async () => {
    mockSessionDeleteMany.mockResolvedValue({ count: 2 });
    mockVerificationDeleteMany.mockResolvedValue({ count: 0 });
    mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );

    await GET(makeRequest(`Bearer ${CRON_SECRET}`));

    expect(mockSessionDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: expect.objectContaining({ lt: expect.any(Date) }),
        }),
      }),
    );
  });

  it("calls verification.deleteMany with expiresAt filter", async () => {
    mockSessionDeleteMany.mockResolvedValue({ count: 0 });
    mockVerificationDeleteMany.mockResolvedValue({ count: 1 });
    mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );

    await GET(makeRequest(`Bearer ${CRON_SECRET}`));

    expect(mockVerificationDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: expect.objectContaining({ lt: expect.any(Date) }),
        }),
      }),
    );
  });

  it("calls handleApiError when $transaction throws", async () => {
    mockTransaction.mockRejectedValue(new Error("Database connection error"));

    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    });

    const response = await GET(makeRequest(`Bearer ${CRON_SECRET}`));
    const data = (await response.json()) as {
      success: boolean;
      message: string;
    };

    expect(mockHandleApiError).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
