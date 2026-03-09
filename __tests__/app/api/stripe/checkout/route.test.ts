import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockGetSession = vi.fn();
const mockCreateCheckoutSession = vi.fn();
const mockHandleApiError = vi.fn();

vi.mock("@/lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock(
  "@/features/billing/services/stripe/create-checkout-session.service",
  () => ({
    createCheckoutSession: mockCreateCheckoutSession,
  }),
);

vi.mock("@/utils/errors/handle-api-error", () => ({
  handleApiError: mockHandleApiError,
}));

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_PRICE_ID_PRO: "price_pro_123",
  },
}));

// Import after mocks
const { POST } = await import("@/app/api/stripe/checkout/route");

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no session", async () => {
    mockGetSession.mockResolvedValue(null);

    const formData = new FormData();
    formData.append("priceId", "price_pro_123");

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
    const data = (await response.json()) as { success: boolean };

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it("parses formData and validates with Zod", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    formData.append("priceId", "price_pro_123");

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCreateCheckoutSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session_123",
    });

    await POST(mockRequest);

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      userId: "user-123",
      priceId: "price_pro_123",
    });
  });

  it("returns 201 with url on success", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    formData.append("priceId", "price_pro_123");

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const expectedUrl = "https://checkout.stripe.com/session_abc123";
    mockCreateCheckoutSession.mockResolvedValue({ url: expectedUrl });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      success: true,
      data: { url: expectedUrl },
    });
  });

  it("calls handleApiError on Zod validation error", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    // Missing priceId

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockHandleApiError.mockReturnValue(
      Response.json(
        { success: false, message: "Validation failed" },
        { status: 400 },
      ),
    );

    await POST(mockRequest);

    expect(mockHandleApiError).toHaveBeenCalled();
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it("calls handleApiError when createCheckoutSession throws", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const formData = new FormData();
    formData.append("priceId", "price_pro_123");

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCreateCheckoutSession.mockRejectedValue(new Error("Stripe API error"));

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

  it("uses session.user.id for userId", async () => {
    const userId = "user-abc-123";
    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "test@example.com" },
    });

    const formData = new FormData();
    formData.append("priceId", "price_pro_123");

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    mockCreateCheckoutSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session",
    });

    await POST(mockRequest);

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      userId,
      priceId: "price_pro_123",
    });
  });
});
