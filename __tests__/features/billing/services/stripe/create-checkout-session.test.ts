import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/utils/errors/errors";

// Create mocks
const mockPrismaOrganizationFindUnique = vi.fn();
const mockPrismaMemberFindFirst = vi.fn();
const mockPrismaStripeCustomerFindUnique = vi.fn();
const mockPrismaStripeCustomerCreate = vi.fn();
const mockStripeCustomersRetrieve = vi.fn();
const mockStripeCustomersUpdate = vi.fn();
const mockStripeCustomersCreate = vi.fn();
const mockStripeCustomersDel = vi.fn();
const mockStripeSubscriptionsList = vi.fn();
const mockStripeCheckoutCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: mockPrismaOrganizationFindUnique,
    },
    member: {
      findFirst: mockPrismaMemberFindFirst,
    },
    stripeCustomer: {
      findUnique: mockPrismaStripeCustomerFindUnique,
      create: mockPrismaStripeCustomerCreate,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: {
      retrieve: mockStripeCustomersRetrieve,
      update: mockStripeCustomersUpdate,
      create: mockStripeCustomersCreate,
      del: mockStripeCustomersDel,
    },
    subscriptions: {
      list: mockStripeSubscriptionsList,
    },
    checkout: {
      sessions: {
        create: mockStripeCheckoutCreate,
      },
    },
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_PRICE_ID_PRO: "price_pro_123",
    NEXT_PUBLIC_BASE_URL: "https://test.example.com",
  },
}));

// Import after mocks
const { createCheckoutSession } =
  await import("@/features/billing/services/stripe/create-checkout-session.service");

const validInput = {
  organizationId: "org-123",
  userId: "user-123",
  priceId: "price_pro_123",
};

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates session and returns url", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: "org-123",
      name: "Acme Corp",
    });

    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      deleted: false,
      name: "Acme Corp",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session_123",
    });

    const result = await createCheckoutSession(validInput);

    expect(result.url).toBe("https://checkout.stripe.com/session_123");
    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith({
      customer: "cus_123",
      line_items: [
        {
          price: "price_pro_123",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url:
        "https://test.example.com/dashboard/facturation?success=true",
      cancel_url: "https://test.example.com/tarifs?canceled=true",
      metadata: {
        organizationId: "org-123",
      },
    });
  });

  it("throws NotFoundError if organization not found", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue(null);

    await expect(createCheckoutSession(validInput)).rejects.toThrow(
      NotFoundError,
    );
    await expect(createCheckoutSession(validInput)).rejects.toThrow(
      "errors.organizations.notFound",
    );
  });

  it("throws ForbiddenError if user is not owner or admin", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: "org-123",
      name: "Acme Corp",
    });

    mockPrismaMemberFindFirst.mockResolvedValue(null);

    await expect(createCheckoutSession(validInput)).rejects.toThrow(
      ForbiddenError,
    );
    await expect(createCheckoutSession(validInput)).rejects.toThrow(
      "errors.billing.manageForbidden",
    );
  });

  it("throws BadRequestError if priceId invalid", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: "org-123",
      name: "Acme Corp",
    });

    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    await expect(
      createCheckoutSession({
        ...validInput,
        priceId: "price_invalid",
      }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      createCheckoutSession({
        ...validInput,
        priceId: "price_invalid",
      }),
    ).rejects.toThrow("errors.billing.invalidPrice");
  });

  it("throws ConflictError if active subscription exists", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: "org-123",
      name: "Acme Corp",
    });

    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      deleted: false,
      name: "Acme Corp",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [{ id: "sub_active" }],
    });

    await expect(createCheckoutSession(validInput)).rejects.toThrow(
      ConflictError,
    );
    await expect(createCheckoutSession(validInput)).rejects.toThrow(
      "errors.billing.alreadySubscribed",
    );
  });

  it("creates Stripe customer if not exists", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: "org-123",
      name: "Acme Corp",
    });

    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

    mockStripeCustomersCreate.mockResolvedValue({
      id: "cus_new",
    });

    mockPrismaStripeCustomerCreate.mockResolvedValue({
      organizationId: "org-123",
      stripeCustomerId: "cus_new",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/new",
    });

    await createCheckoutSession(validInput);

    expect(mockStripeCustomersCreate).toHaveBeenCalledWith(
      {
        name: "Acme Corp",
        metadata: {
          organizationId: "org-123",
        },
      },
      {
        idempotencyKey: "stripe-org-customer-org-123",
      },
    );

    expect(mockPrismaStripeCustomerCreate).toHaveBeenCalledWith({
      data: {
        organizationId: "org-123",
        stripeCustomerId: "cus_new",
      },
    });
  });

  it("throws BadRequestError if session.url is null", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: "org-123",
      name: "Acme Corp",
    });

    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      deleted: false,
      name: "Acme Corp",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: null,
    });

    await expect(createCheckoutSession(validInput)).rejects.toThrow(
      BadRequestError,
    );
    await expect(createCheckoutSession(validInput)).rejects.toThrow(
      "errors.billing.checkoutSessionFailed",
    );
  });
});
