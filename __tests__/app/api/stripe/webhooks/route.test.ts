import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockHandleStripeWebhook = vi.fn();

vi.mock("@/features/billing/services/stripe/handle-webhook.service", () => ({
  handleStripeWebhook: mockHandleStripeWebhook,
}));

// Import after mocks
const { POST } = await import("@/app/api/stripe/webhooks/route");

describe("POST /api/stripe/webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if stripe-signature header is missing", async () => {
    const mockRequest = {
      text: vi.fn().mockResolvedValue("webhook body"),
      headers: new Headers(),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: "Signature manquante",
    });
    expect(mockHandleStripeWebhook).not.toHaveBeenCalled();
  });

  it("calls handleStripeWebhook with body and signature", async () => {
    const webhookBody = "webhook body content";
    const signature = "whsec_test_signature";

    const mockRequest = {
      text: vi.fn().mockResolvedValue(webhookBody),
      headers: new Headers({ "stripe-signature": signature }),
    } as unknown as Request;

    mockHandleStripeWebhook.mockResolvedValue({
      body: { received: true },
      status: 200,
    });

    await POST(mockRequest);

    expect(mockHandleStripeWebhook).toHaveBeenCalledWith(
      webhookBody,
      signature,
    );
  });

  it("returns the result from handleStripeWebhook with correct status", async () => {
    const webhookBody = "webhook body";
    const signature = "whsec_signature";
    const expectedBody = { received: true, eventId: "evt_123" };
    const expectedStatus = 200;

    const mockRequest = {
      text: vi.fn().mockResolvedValue(webhookBody),
      headers: new Headers({ "stripe-signature": signature }),
    } as unknown as Request;

    mockHandleStripeWebhook.mockResolvedValue({
      body: expectedBody,
      status: expectedStatus,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(expectedStatus);
    expect(data).toEqual(expectedBody);
  });

  it("handles webhook processing errors gracefully", async () => {
    const webhookBody = "invalid webhook";
    const signature = "whsec_invalid";

    const mockRequest = {
      text: vi.fn().mockResolvedValue(webhookBody),
      headers: new Headers({ "stripe-signature": signature }),
    } as unknown as Request;

    mockHandleStripeWebhook.mockResolvedValue({
      body: { received: false, error: "Invalid signature" },
      status: 400,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      received: false,
      error: "Invalid signature",
    });
  });

  it("returns 200 even when handleStripeWebhook encounters internal errors", async () => {
    const webhookBody = "webhook with internal error";
    const signature = "whsec_signature";

    const mockRequest = {
      text: vi.fn().mockResolvedValue(webhookBody),
      headers: new Headers({ "stripe-signature": signature }),
    } as unknown as Request;

    // Service returns 200 even on internal errors to prevent Stripe retry storms
    mockHandleStripeWebhook.mockResolvedValue({
      body: { received: true },
      status: 200,
    });

    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
  });
});
