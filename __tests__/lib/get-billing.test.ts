import { getBilling } from "@/features/billing/services/get-billing.service";
import { describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeCustomer: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    invoices: {
      list: vi.fn(),
    },
    subscriptions: {
      list: vi.fn(),
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe("getBilling", () => {
  const mockUserId = "user-123";
  const mockStripeCustomerId = "cus_123";

  it("returns null when no stripe customer found", async () => {
    vi.mocked(prisma.stripeCustomer.findUnique).mockResolvedValue(null);

    const result = await getBilling(mockUserId);

    expect(result).toBeNull();
    expect(prisma.stripeCustomer.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      select: { stripeCustomerId: true },
    });
  });

  it("uses cached invoices when available", async () => {
    const cachedInvoices = [
      {
        id: "inv_1",
        number: "INV-001",
        status: "paid" as const,
        created: 1700000000,
        amountPaid: 2900,
        paidAt: 1700000100,
        invoicePdfUrl: "https://example.com/inv.pdf",
      },
    ];

    vi.mocked(prisma.stripeCustomer.findUnique).mockResolvedValue({
      stripeCustomerId: mockStripeCustomerId,
    } as any);
    vi.mocked(redis.get).mockResolvedValue(cachedInvoices);
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [],
    } as any);

    const result = await getBilling(mockUserId);

    expect(result).not.toBeNull();
    expect(result!.invoices).toEqual(cachedInvoices);
    expect(stripe.invoices.list).not.toHaveBeenCalled();
  });

  it("fetches invoices from Stripe when cache is empty", async () => {
    const mockStripeInvoice = {
      id: "inv_1",
      number: "INV-001",
      status: "paid",
      created: 1700000000,
      amount_paid: 2900,
      status_transitions: { paid_at: 1700000100 },
      invoice_pdf: "https://example.com/inv.pdf",
    };

    vi.mocked(prisma.stripeCustomer.findUnique).mockResolvedValue({
      stripeCustomerId: mockStripeCustomerId,
    } as any);
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(stripe.invoices.list).mockResolvedValue({
      data: [mockStripeInvoice],
    } as any);
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [],
    } as any);

    const result = await getBilling(mockUserId);

    expect(result).not.toBeNull();
    expect(result!.invoices).toHaveLength(1);
    expect(result!.invoices[0].id).toBe("inv_1");
    expect(result!.invoices[0].amountPaid).toBe(2900);
    expect(result!.invoices[0].invoicePdfUrl).toBe(
      "https://example.com/inv.pdf"
    );

    expect(stripe.invoices.list).toHaveBeenCalledWith({
      customer: mockStripeCustomerId,
      limit: 100,
    });

    expect(redis.set).toHaveBeenCalledWith(
      `invoices:${mockUserId}`,
      expect.any(Array),
      { ex: 300 }
    );
  });

  it("maps subscriptions correctly", async () => {
    const mockSubscription = {
      id: "sub_1",
      status: "active",
      cancel_at_period_end: false,
      canceled_at: null,
      items: {
        data: [
          {
            current_period_start: 1700000000,
            current_period_end: 1702592000,
            price: { id: "price_123" },
          },
        ],
      },
    };

    vi.mocked(prisma.stripeCustomer.findUnique).mockResolvedValue({
      stripeCustomerId: mockStripeCustomerId,
    } as any);
    vi.mocked(redis.get).mockResolvedValue([]);
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [mockSubscription],
    } as any);

    const result = await getBilling(mockUserId);

    expect(result).not.toBeNull();
    expect(result!.subscriptions).toHaveLength(1);
    expect(result!.subscriptions[0]).toEqual({
      id: "sub_1",
      status: "active",
      currentPeriodStart: 1700000000,
      currentPeriodEnd: 1702592000,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      priceId: "price_123",
    });
  });

  it("handles subscription with no items", async () => {
    const mockSubscription = {
      id: "sub_1",
      status: "active",
      cancel_at_period_end: false,
      canceled_at: null,
      items: { data: [] },
    };

    vi.mocked(prisma.stripeCustomer.findUnique).mockResolvedValue({
      stripeCustomerId: mockStripeCustomerId,
    } as any);
    vi.mocked(redis.get).mockResolvedValue([]);
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [mockSubscription],
    } as any);

    const result = await getBilling(mockUserId);

    expect(result).not.toBeNull();
    expect(result!.subscriptions[0].currentPeriodStart).toBe(0);
    expect(result!.subscriptions[0].currentPeriodEnd).toBe(0);
    expect(result!.subscriptions[0].priceId).toBeNull();
  });

  it("handles invoice with missing optional fields", async () => {
    const mockInvoice = {
      id: "inv_1",
      number: null,
      status: null,
      created: 1700000000,
      amount_paid: null,
      status_transitions: { paid_at: null },
      invoice_pdf: null,
    };

    vi.mocked(prisma.stripeCustomer.findUnique).mockResolvedValue({
      stripeCustomerId: mockStripeCustomerId,
    } as any);
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(stripe.invoices.list).mockResolvedValue({
      data: [mockInvoice],
    } as any);
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [],
    } as any);

    const result = await getBilling(mockUserId);

    expect(result).not.toBeNull();
    expect(result!.invoices[0]).toEqual({
      id: "inv_1",
      number: null,
      status: null,
      created: 1700000000,
      amountPaid: null,
      paidAt: null,
      invoicePdfUrl: null,
    });
  });
});
