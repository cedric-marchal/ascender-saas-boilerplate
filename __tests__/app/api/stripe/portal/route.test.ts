import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockCreatePortalSession = vi.fn();
const mockHandleApiError = vi.fn();
const mockCheckRatelimit = vi.fn();

vi.mock("@/lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock(
  "@/features/billing/services/stripe/create-portal-session.service",
  () => ({
    createPortalSession: mockCreatePortalSession,
  }),
);

vi.mock("@/utils/errors/handle-api-error", () => ({
  handleApiError: mockHandleApiError,
}));

vi.mock("@/utils/ratelimit/check-ratelimit", () => ({
  checkRatelimit: mockCheckRatelimit,
}));

vi.mock("@/lib/ratelimit", () => ({
  authenticatedRatelimit: {},
}));

const { POST } = await import("@/app/api/stripe/portal/route");

describe("POST /api/stripe/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRatelimit.mockResolvedValue(undefined);
  });

  it("returns 401 if no session", async () => {
    mockGetSession.mockResolvedValue(null);

    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 401 },
      );
    });

    const response = await POST();
    const data = (await response.json()) as { success: boolean };

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockCreatePortalSession).not.toHaveBeenCalled();
  });

  it("returns 201 with portal url on success", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const expectedResult = {
      url: "https://billing.stripe.com/portal/session_abc",
    };
    mockCreatePortalSession.mockResolvedValue(expectedResult);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({ success: true, data: expectedResult });
  });

  it("passes session.user.id to createPortalSession", async () => {
    const userId = "user-abc-456";

    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "test@example.com" },
    });

    mockCreatePortalSession.mockResolvedValue({
      url: "https://billing.stripe.com/portal/session_xyz",
    });

    await POST();

    expect(mockCreatePortalSession).toHaveBeenCalledWith({ userId });
  });

  it("calls checkRatelimit with authenticated limiter and userId", async () => {
    const userId = "user-rate-limit-test";

    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "test@example.com" },
    });

    mockCreatePortalSession.mockResolvedValue({
      url: "https://billing.stripe.com/portal/session_xyz",
    });

    await POST();

    expect(mockCheckRatelimit).toHaveBeenCalledWith({}, userId);
  });

  it("calls handleApiError when createPortalSession throws", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    mockCreatePortalSession.mockRejectedValue(new Error("Stripe API error"));

    mockHandleApiError.mockImplementation((error: Error) => {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    });

    const response = await POST();

    expect(mockHandleApiError).toHaveBeenCalled();
    expect(response.status).toBe(500);
  });
});
