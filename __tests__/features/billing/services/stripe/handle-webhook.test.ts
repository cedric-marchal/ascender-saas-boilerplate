import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks before imports
const mockConstructEvent = vi.fn();
const mockPrismaUpsert = vi.fn();
const mockPrismaDeleteMany = vi.fn();
const mockPrismaFindUnique = vi.fn();
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisDel = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeCustomer: {
      findUnique: mockPrismaFindUnique,
    },
    subscription: {
      upsert: mockPrismaUpsert,
      deleteMany: mockPrismaDeleteMany,
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
  },
}));

// Import after mocks
const { handleStripeWebhook } =
  await import("@/features/billing/services/stripe/handle-webhook.service");

describe("handleStripeWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue("OK");
  });

  describe("signature validation", () => {
    it("returns 400 for invalid signature", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const result = await handleStripeWebhook("body", "invalid-sig");

      expect(result.status).toBe(400);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain("Invalid signature");
    });

    it("returns 400 with error message for unknown error", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw "String error";
      });

      const result = await handleStripeWebhook("body", "sig");

      expect(result.status).toBe(400);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain("Erreur inconnue");
    });
  });

  describe("idempotence", () => {
    it("returns 200 without processing if event already processed", async () => {
      const mockEvent = {
        id: "evt_test_123",
        type: "customer.subscription.created",
        data: { object: {} },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockRedisGet.mockResolvedValue("1");

      const result = await handleStripeWebhook("body", "sig");

      expect(result.status).toBe(200);
      expect(result.body.received).toBe(true);
      expect(mockPrismaUpsert).not.toHaveBeenCalled();
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it("marks event as processed in Redis", async () => {
      const mockEvent = {
        id: "evt_test_123",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_123",
            status: "active",
            items: {
              data: [
                {
                  price: { id: "price_123" },
                  current_period_start: 1234567890,
                  current_period_end: 1234577890,
                },
              ],
            },
            cancel_at_period_end: false,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockRedisGet.mockResolvedValue(null);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_123",
        stripeCustomerId: "cus_123",
      });

      await handleStripeWebhook("body", "sig");

      expect(mockRedisSet).toHaveBeenCalledWith(
        "stripe:event:evt_test_123",
        1,
        { ex: 86400 },
      );
    });
  });

  describe("customer.subscription.created/updated", () => {
    it("creates/upserts subscription with correct fields", async () => {
      const mockEvent = {
        id: "evt_test_123",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_123",
            status: "active",
            items: {
              data: [
                {
                  price: { id: "price_123" },
                  current_period_start: 1234567890,
                  current_period_end: 1234577890,
                },
              ],
            },
            cancel_at_period_end: false,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_123",
        stripeCustomerId: "cus_123",
      });

      await handleStripeWebhook("body", "sig");

      expect(mockPrismaUpsert).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_123" },
        create: {
          stripeSubscriptionId: "sub_123",
          stripeCustomerId: "cus_123",
          stripePriceId: "price_123",
          status: "ACTIVE",
          currentPeriodStart: new Date(1234567890 * 1000),
          currentPeriodEnd: new Date(1234577890 * 1000),
          cancelAtPeriodEnd: false,
        },
        update: {
          stripePriceId: "price_123",
          status: "ACTIVE",
          currentPeriodStart: new Date(1234567890 * 1000),
          currentPeriodEnd: new Date(1234577890 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
    });

    it("handles customer as object", async () => {
      const mockEvent = {
        id: "evt_test_456",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_456",
            customer: { id: "cus_456" },
            status: "trialing",
            items: {
              data: [
                {
                  price: { id: "price_456" },
                  current_period_start: 1234567890,
                  current_period_end: 1234577890,
                },
              ],
            },
            cancel_at_period_end: true,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_456",
        stripeCustomerId: "cus_456",
      });

      await handleStripeWebhook("body", "sig");

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_456" },
        select: { organizationId: true, stripeCustomerId: true },
      });
      expect(mockPrismaUpsert).toHaveBeenCalled();
    });

    it("logs warning if StripeCustomer not found", async () => {
      const mockEvent = {
        id: "evt_test_789",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_789",
            customer: "cus_missing",
            status: "active",
            items: { data: [{ price: { id: "price_789" } }] },
            cancel_at_period_end: false,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue(null);

      await handleStripeWebhook("body", "sig");

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("StripeCustomer not found"),
      );
      expect(mockPrismaUpsert).not.toHaveBeenCalled();
    });

    it("skips if priceId missing", async () => {
      const mockEvent = {
        id: "evt_test_abc",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_abc",
            customer: "cus_abc",
            status: "active",
            items: { data: [] },
            cancel_at_period_end: false,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        userId: "user_abc",
        stripeCustomerId: "cus_abc",
      });

      await handleStripeWebhook("body", "sig");

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Missing priceId"),
      );
      expect(mockPrismaUpsert).not.toHaveBeenCalled();
    });

    it("skips if status invalid", async () => {
      const mockEvent = {
        id: "evt_test_def",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_def",
            customer: "cus_def",
            status: "invalid_status",
            items: {
              data: [
                {
                  price: { id: "price_def" },
                  current_period_start: 1234567890,
                  current_period_end: 1234577890,
                },
              ],
            },
            cancel_at_period_end: false,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_def",
        stripeCustomerId: "cus_def",
      });

      await handleStripeWebhook("body", "sig");

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unknown subscription status"),
      );
      expect(mockPrismaUpsert).not.toHaveBeenCalled();
    });

    it("handles cancelAtPeriodEnd true", async () => {
      const mockEvent = {
        id: "evt_test_cancel",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_cancel",
            customer: "cus_cancel",
            status: "active",
            items: {
              data: [
                {
                  price: { id: "price_cancel" },
                  current_period_start: 1234567890,
                  current_period_end: 1234577890,
                },
              ],
            },
            cancel_at_period_end: true,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_cancel",
        stripeCustomerId: "cus_cancel",
      });

      await handleStripeWebhook("body", "sig");

      expect(mockPrismaUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ cancelAtPeriodEnd: true }),
          update: expect.objectContaining({ cancelAtPeriodEnd: true }),
        }),
      );
    });
  });

  describe("customer.subscription.deleted", () => {
    it("deletes subscription from DB", async () => {
      const mockEvent = {
        id: "evt_test_del",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_del",
            customer: "cus_del",
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_del",
      });

      await handleStripeWebhook("body", "sig");

      expect(mockPrismaDeleteMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_del" },
      });
    });

    it("logs warning if customer not found", async () => {
      const mockEvent = {
        id: "evt_test_del2",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_del2",
            customer: "cus_missing",
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue(null);

      await handleStripeWebhook("body", "sig");

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("StripeCustomer not found"),
      );
      expect(mockPrismaDeleteMany).not.toHaveBeenCalled();
    });

    it("handles customer as object in deleted event", async () => {
      const mockEvent = {
        id: "evt_test_del3",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_del3",
            customer: { id: "cus_del3" },
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_del3",
      });

      await handleStripeWebhook("body", "sig");

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_del3" },
        select: { organizationId: true },
      });
    });
  });

  describe("invoice.* events", () => {
    it("invalidates Redis cache for user", async () => {
      const mockEvent = {
        id: "evt_inv_123",
        type: "invoice.payment_succeeded",
        data: {
          object: {
            customer: "cus_inv",
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_inv",
      });

      await handleStripeWebhook("body", "sig");

      expect(mockRedisDel).toHaveBeenCalledWith("invoices:org:org_inv");
    });

    it("does not process invoice.payment_succeeded with null customerId", async () => {
      const mockEvent = {
        id: "evt_inv_null",
        type: "invoice.payment_succeeded",
        data: {
          object: {
            customer: null,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);

      await handleStripeWebhook("body", "sig");

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("No customer ID in invoice"),
      );
      expect(mockRedisDel).not.toHaveBeenCalled();
    });

    it("does not process invoice.payment_failed when StripeCustomer not found", async () => {
      const mockEvent = {
        id: "evt_inv_missing",
        type: "invoice.payment_failed",
        data: {
          object: {
            customer: "cus_missing",
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue(null);

      await handleStripeWebhook("body", "sig");

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("StripeCustomer not found"),
      );
      expect(mockRedisDel).not.toHaveBeenCalled();
    });

    it("handles customer as object in invoice", async () => {
      const mockEvent = {
        id: "evt_inv_obj",
        type: "invoice.payment_failed",
        data: {
          object: {
            customer: { id: "cus_inv_obj" },
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_inv_obj",
      });

      await handleStripeWebhook("body", "sig");

      expect(mockRedisDel).toHaveBeenCalledWith("invoices:org:org_inv_obj");
    });
  });

  describe("unknown events", () => {
    it("does not crash on unknown event type", async () => {
      const mockEvent = {
        id: "evt_unknown",
        type: "customer.source.created",
        data: { object: {} },
      };
      mockConstructEvent.mockReturnValue(mockEvent);

      const result = await handleStripeWebhook("body", "sig");

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("logs error and returns 200", async () => {
      const mockEvent = {
        id: "evt_error",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_error",
            customer: "cus_error",
            status: "active",
            items: {
              data: [
                {
                  price: { id: "price_error" },
                  current_period_start: 1234567890,
                  current_period_end: 1234577890,
                },
              ],
            },
            cancel_at_period_end: false,
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockRejectedValue(new Error("DB error"));

      const result = await handleStripeWebhook("body", "sig");

      expect(console.error).toHaveBeenCalledWith(
        "Webhook processing error:",
        expect.any(Error),
      );
      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });

    it("returns 200 even on internal processing errors", async () => {
      const mockEvent = {
        id: "evt_internal_error",
        type: "invoice.payment_succeeded",
        data: {
          object: {
            customer: "cus_error",
          },
        },
      };
      mockConstructEvent.mockReturnValue(mockEvent);
      mockPrismaFindUnique.mockRejectedValue(new Error("Internal error"));

      const result = await handleStripeWebhook("body", "sig");

      expect(result.status).toBe(200);
      expect(result.body.received).toBe(true);
    });
  });
});
