import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE importing services
// ---------------------------------------------------------------------------

const mockPrismaStripeCustomerFindUnique = vi.fn();
const mockPrismaMemberFindFirst = vi.fn();
const mockPrismaOrganizationFindUnique = vi.fn();
const mockPrismaStripeCustomerCreate = vi.fn();
const mockPrismaSubscriptionFindFirst = vi.fn();
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockStripeInvoicesList = vi.fn();
const mockStripeSubscriptionsList = vi.fn();
const mockStripeCustomersRetrieve = vi.fn();
const mockStripeCustomersCreate = vi.fn();
const mockStripeCustomersDel = vi.fn();
const mockStripeCustomersUpdate = vi.fn();
const mockStripeCheckoutCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeCustomer: {
      findUnique: mockPrismaStripeCustomerFindUnique,
      create: mockPrismaStripeCustomerCreate,
    },
    member: {
      findFirst: mockPrismaMemberFindFirst,
    },
    organization: {
      findUnique: mockPrismaOrganizationFindUnique,
    },
    subscription: {
      findFirst: mockPrismaSubscriptionFindFirst,
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    invoices: {
      list: mockStripeInvoicesList,
    },
    subscriptions: {
      list: mockStripeSubscriptionsList,
    },
    customers: {
      retrieve: mockStripeCustomersRetrieve,
      create: mockStripeCustomersCreate,
      del: mockStripeCustomersDel,
      update: mockStripeCustomersUpdate,
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
    STRIPE_PRICE_ID_PRO: "price_pro_test_123",
    NEXT_PUBLIC_BASE_URL: "https://test.example.com",
  },
}));

// Import services AFTER mocks
const { getBilling } =
  await import("@/features/billing/services/get-billing.service");

const { createCheckoutSession } =
  await import("@/features/billing/services/stripe/create-checkout-session.service");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG_A_ID = "org-a";
const ORG_B_ID = "org-b";
const USER_IN_ORG_A = "user-a-1";
const STRIPE_CUSTOMER_A = "cus_a_123";
const STRIPE_CUSTOMER_B = "cus_b_456";

// ---------------------------------------------------------------------------
// Tests: getBilling — org-scoped
// ---------------------------------------------------------------------------

describe("getBilling — resolves ONLY the caller's org Stripe customer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for org A when org A has no Stripe customer", async () => {
    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

    const result = await getBilling(ORG_A_ID);

    expect(result).toBeNull();
    // MUST query by organizationId — not by any other field
    expect(mockPrismaStripeCustomerFindUnique).toHaveBeenCalledWith({
      where: { organizationId: ORG_A_ID },
      select: { stripeCustomerId: true },
    });
  });

  it("queries org A Stripe customer and never touches org B", async () => {
    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: STRIPE_CUSTOMER_A,
    });
    mockRedisGet.mockResolvedValue(null);
    mockStripeInvoicesList.mockResolvedValue({ data: [] });
    mockStripeSubscriptionsList.mockResolvedValue({ data: [] });

    await getBilling(ORG_A_ID);

    // Should query for org A only
    expect(mockPrismaStripeCustomerFindUnique).toHaveBeenCalledWith({
      where: { organizationId: ORG_A_ID },
      select: { stripeCustomerId: true },
    });

    // Should use org A's Stripe customer, NOT org B's
    expect(mockStripeInvoicesList).toHaveBeenCalledWith({
      customer: STRIPE_CUSTOMER_A,
      limit: 100,
    });

    expect(mockStripeInvoicesList).not.toHaveBeenCalledWith({
      customer: STRIPE_CUSTOMER_B,
      limit: 100,
    });
  });

  it("IDOR gate — getBilling where clause MUST use organizationId not userId", async () => {
    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: STRIPE_CUSTOMER_A,
    });
    mockRedisGet.mockResolvedValue(null);
    mockStripeInvoicesList.mockResolvedValue({ data: [] });
    mockStripeSubscriptionsList.mockResolvedValue({ data: [] });

    await getBilling(ORG_A_ID);

    const callArgs = mockPrismaStripeCustomerFindUnique.mock.calls[0]![0];

    // Must use organizationId (not userId)
    expect(callArgs.where).toHaveProperty("organizationId");
    expect(callArgs.where).not.toHaveProperty("userId");
  });
});

// ---------------------------------------------------------------------------
// Tests: createCheckoutSession — membership check (IDOR)
// ---------------------------------------------------------------------------

describe("createCheckoutSession — membership check prevents cross-org billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ForbiddenError when user is not owner/admin of the org", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: ORG_A_ID,
      name: "Org A",
    });

    // User has no membership in the org (cross-org attempt)
    mockPrismaMemberFindFirst.mockResolvedValue(null);

    await expect(
      createCheckoutSession({
        organizationId: ORG_A_ID,
        userId: "user-outside",
        priceId: "price_pro_test_123",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError when organization does not exist", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue(null);

    await expect(
      createCheckoutSession({
        organizationId: "nonexistent-org",
        userId: USER_IN_ORG_A,
        priceId: "price_pro_test_123",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("IDOR gate — membership check uses BOTH organizationId AND userId", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: ORG_A_ID,
      name: "Org A",
    });

    // User in org A trying to checkout for org B
    mockPrismaMemberFindFirst.mockResolvedValue(null); // Not a member of org B

    await expect(
      createCheckoutSession({
        organizationId: ORG_B_ID, // Attempting org B checkout
        userId: USER_IN_ORG_A, // User is from org A
        priceId: "price_pro_test_123",
      }),
    ).rejects.toThrow(ForbiddenError);

    // The findFirst must check BOTH fields — not just one
    expect(mockPrismaMemberFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: ORG_B_ID,
          userId: USER_IN_ORG_A,
        }),
      }),
    );
  });

  it("allows checkout when user is owner of the org and returns url", async () => {
    mockPrismaOrganizationFindUnique.mockResolvedValue({
      id: ORG_A_ID,
      name: "Org A",
    });

    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: STRIPE_CUSTOMER_A,
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: STRIPE_CUSTOMER_A,
      deleted: false,
      name: "Org A",
    });

    mockStripeSubscriptionsList.mockResolvedValue({ data: [] });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/test",
    });

    const result = await createCheckoutSession({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      priceId: "price_pro_test_123",
    });

    expect(result.url).toBe("https://checkout.stripe.com/test");
  });
});
