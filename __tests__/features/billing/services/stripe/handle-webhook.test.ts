import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks before imports
const mockConstructEvent = vi.fn();
const mockPrismaUpsert = vi.fn();
const mockPrismaDeleteMany = vi.fn();
const mockPrismaFindUnique = vi.fn();
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisDel = vi.fn();
const mockPrismaOrganizationFindUnique = vi.fn();
const mockPrismaMemberFindFirst = vi.fn();
const mockSendPaymentFailedEmail = vi.fn();

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
    organization: {
      findUnique: mockPrismaOrganizationFindUnique,
    },
    member: {
      findFirst: mockPrismaMemberFindFirst,
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

vi.mock(
  "@/features/billing/services/send-payment-failed-email.service",
  () => ({
    sendPaymentFailedEmail: mockSendPaymentFailedEmail,
  }),
);

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
    mockPrismaOrganizationFindUnique.mockResolvedValue(null);
    mockPrismaMemberFindFirst.mockResolvedValue(null);
    mockSendPaymentFailedEmail.mockResolvedValue(undefined);
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

    it("marks event as processed in Redis AFTER the handler succeeds", async () => {
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

      const callOrder: string[] = [];
      mockPrismaUpsert.mockImplementation(async () => {
        callOrder.push("upsert");
      });
      mockRedisDel.mockImplementation(async () => {
        callOrder.push("del");
      });
      mockRedisSet.mockImplementation(async () => {
        callOrder.push("set");
        return "OK";
      });

      await handleStripeWebhook("body", "sig");

      // Redis set (idempotency mark) must come AFTER upsert and cache invalidation
      expect(callOrder).toEqual(["upsert", "del", "set"]);

      expect(mockRedisSet).toHaveBeenCalledWith(
        "stripe:event:evt_test_123",
        1,
        { ex: 86400 },
      );
    });

    it("does NOT set idempotency key when handler fails", async () => {
      const mockEvent = {
        id: "evt_fail",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_fail",
            customer: "cus_fail",
            status: "active",
            items: {
              data: [
                {
                  price: { id: "price_fail" },
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
      mockPrismaFindUnique.mockRejectedValue(new Error("DB failure"));

      const result = await handleStripeWebhook("body", "sig");

      // Handler failed → idempotency key must NOT be set (Stripe can retry)
      expect(mockRedisSet).not.toHaveBeenCalled();
      // Must return 5xx so Stripe retries
      expect(result.status).toBeGreaterThanOrEqual(500);
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

  describe("invoice.payment_failed dunning email", () => {
    function buildPaymentFailedEvent(eventId: string, invoiceId: string) {
      return {
        id: eventId,
        type: "invoice.payment_failed",
        data: {
          object: {
            id: invoiceId,
            customer: "cus_dunning",
          },
        },
      };
    }

    it("sends the dunning email to the organization owner", async () => {
      mockConstructEvent.mockReturnValue(
        buildPaymentFailedEvent("evt_dunning_1", "in_dunning_1"),
      );
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_dunning",
      });
      mockPrismaOrganizationFindUnique.mockResolvedValue({
        name: "Acme Inc.",
      });
      mockPrismaMemberFindFirst.mockResolvedValue({
        user: { email: "owner@acme.test" },
      });

      const result = await handleStripeWebhook("body", "sig");

      expect(mockPrismaMemberFindFirst).toHaveBeenCalledWith({
        where: { organizationId: "org_dunning", role: "owner" },
        select: { user: { select: { email: true } } },
      });
      expect(mockSendPaymentFailedEmail).toHaveBeenCalledWith({
        email: "owner@acme.test",
        organizationName: "Acme Inc.",
        locale: "en",
      });
      expect(mockRedisSet).toHaveBeenCalledWith(
        "stripe:payment-failed-email:in_dunning_1",
        1,
        { ex: 86400 },
      );
      expect(result.status).toBe(200);
    });

    it("does not send when no owner can be resolved for the organization", async () => {
      mockConstructEvent.mockReturnValue(
        buildPaymentFailedEvent("evt_dunning_no_owner", "in_dunning_no_owner"),
      );
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_no_owner",
      });
      mockPrismaOrganizationFindUnique.mockResolvedValue({
        name: "Orphan Org",
      });
      mockPrismaMemberFindFirst.mockResolvedValue(null);

      const result = await handleStripeWebhook("body", "sig");

      expect(mockSendPaymentFailedEmail).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cannot send dunning email"),
      );
      expect(result.status).toBe(200);
    });

    it("sends nothing on a second event for the SAME invoice (dedupe by invoice id)", async () => {
      mockConstructEvent.mockReturnValue(
        buildPaymentFailedEvent("evt_dunning_retry", "in_dunning_dupe"),
      );
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_dupe",
      });

      // Event-level idempotency key is unset (different event id), but the
      // invoice-level dedupe key was already set by a prior attempt.
      mockRedisGet.mockImplementation(async (key: string) => {
        if (key === "stripe:payment-failed-email:in_dunning_dupe") {
          return "1";
        }

        return null;
      });

      const result = await handleStripeWebhook("body", "sig");

      expect(mockSendPaymentFailedEmail).not.toHaveBeenCalled();
      expect(result.status).toBe(200);
    });

    it("sends again for a DIFFERENT invoice even for the same organization", async () => {
      mockConstructEvent.mockReturnValue(
        buildPaymentFailedEvent("evt_dunning_other", "in_dunning_other"),
      );
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_dupe",
      });
      mockPrismaOrganizationFindUnique.mockResolvedValue({
        name: "Dupe Org",
      });
      mockPrismaMemberFindFirst.mockResolvedValue({
        user: { email: "owner@dupe.test" },
      });

      mockRedisGet.mockImplementation(async (key: string) => {
        if (key === "stripe:payment-failed-email:in_dunning_dupe") {
          return "1";
        }

        return null;
      });

      await handleStripeWebhook("body", "sig");

      expect(mockSendPaymentFailedEmail).toHaveBeenCalledWith({
        email: "owner@dupe.test",
        organizationName: "Dupe Org",
        locale: "en",
      });
    });

    it("returns 5xx and does not poison any idempotency key when the email send fails", async () => {
      mockConstructEvent.mockReturnValue(
        buildPaymentFailedEvent("evt_dunning_fail", "in_dunning_fail"),
      );
      mockPrismaFindUnique.mockResolvedValue({
        organizationId: "org_fail",
      });
      mockPrismaOrganizationFindUnique.mockResolvedValue({
        name: "Failing Org",
      });
      mockPrismaMemberFindFirst.mockResolvedValue({
        user: { email: "owner@failing.test" },
      });
      mockSendPaymentFailedEmail.mockRejectedValue(
        new Error("Resend unavailable"),
      );

      const result = await handleStripeWebhook("body", "sig");

      expect(result.status).toBeGreaterThanOrEqual(500);
      // Neither the event-level nor the invoice-level dedupe key is set.
      expect(mockRedisSet).not.toHaveBeenCalled();
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
    it("logs error and returns 500 for unexpected errors (so Stripe retries)", async () => {
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
      // Must return 5xx so Stripe retries the event
      expect(result.status).toBe(500);
      expect(result.body.success).toBe(false);
    });

    it("returns 500 on internal processing errors so Stripe can retry", async () => {
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

      expect(result.status).toBe(500);
      expect(result.body.success).toBe(false);
    });

    it("does NOT mark event as processed in Redis when handler throws", async () => {
      const mockEvent = {
        id: "evt_no_idempotency_on_fail",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_nif",
            customer: "cus_nif",
            status: "active",
            items: {
              data: [
                {
                  price: { id: "price_nif" },
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
      mockPrismaFindUnique.mockRejectedValue(new Error("DB failure"));

      await handleStripeWebhook("body", "sig");

      // Idempotency key must NOT be set — failed handler must not poison idempotency
      expect(mockRedisSet).not.toHaveBeenCalled();
    });
  });
});
