import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/utils/errors/errors";

// Create mocks
const mockPrismaMemberFindFirst = vi.fn();
const mockPrismaStripeCustomerFindUnique = vi.fn();
const mockStripeBillingPortalCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findFirst: mockPrismaMemberFindFirst,
    },
    stripeCustomer: {
      findUnique: mockPrismaStripeCustomerFindUnique,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: mockStripeBillingPortalCreate,
      },
    },
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_BASE_URL: "https://test.example.com",
  },
}));

// Import after mocks
const { createPortalSession } =
  await import("@/features/billing/services/stripe/create-portal-session.service");

const validInput = {
  organizationId: "org-123",
  userId: "user-123",
};

describe("createPortalSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates portal session and returns url", async () => {
    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeBillingPortalCreate.mockResolvedValue({
      url: "https://billing.stripe.com/session/portal_123",
    });

    const result = await createPortalSession(validInput);

    expect(result.url).toBe("https://billing.stripe.com/session/portal_123");
    expect(mockStripeBillingPortalCreate).toHaveBeenCalledWith(
      {
        customer: "cus_123",
        return_url: "https://test.example.com/dashboard/facturation",
      },
      { idempotencyKey: "portal-org-org-123" },
    );
  });

  it("throws ForbiddenError if user is not owner or admin", async () => {
    mockPrismaMemberFindFirst.mockResolvedValue(null);

    await expect(createPortalSession(validInput)).rejects.toThrow(
      ForbiddenError,
    );
    await expect(createPortalSession(validInput)).rejects.toThrow(
      "propriétaires et administrateurs",
    );
  });

  it("throws NotFoundError if no StripeCustomer", async () => {
    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

    await expect(createPortalSession(validInput)).rejects.toThrow(
      NotFoundError,
    );
    await expect(createPortalSession(validInput)).rejects.toThrow(
      "Aucun client Stripe trouvé",
    );
  });

  it("throws BadRequestError if portalSession.url is null", async () => {
    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeBillingPortalCreate.mockResolvedValue({
      url: null,
    });

    await expect(createPortalSession(validInput)).rejects.toThrow(
      BadRequestError,
    );
    await expect(createPortalSession(validInput)).rejects.toThrow(
      "Impossible de créer la session du portail",
    );
  });

  it("selects correct fields from member", async () => {
    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeBillingPortalCreate.mockResolvedValue({
      url: "https://portal.stripe.com",
    });

    await createPortalSession(validInput);

    expect(mockPrismaMemberFindFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org-123",
        userId: "user-123",
        role: {
          in: ["owner", "admin"],
        },
      },
      select: { id: true },
    });
  });

  it("selects correct fields from stripeCustomer", async () => {
    mockPrismaMemberFindFirst.mockResolvedValue({ id: "member-1" });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeBillingPortalCreate.mockResolvedValue({
      url: "https://portal.stripe.com",
    });

    await createPortalSession(validInput);

    expect(mockPrismaStripeCustomerFindUnique).toHaveBeenCalledWith({
      where: { organizationId: "org-123" },
      select: { stripeCustomerId: true },
    });
  });
});
