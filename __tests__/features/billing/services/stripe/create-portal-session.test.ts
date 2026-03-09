import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors/errors";

// Create mocks
const mockPrismaUserFindUnique = vi.fn();
const mockPrismaStripeCustomerFindUnique = vi.fn();
const mockStripeBillingPortalCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockPrismaUserFindUnique,
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

vi.mock("@/lib/constants/roles.constant", () => ({
  UserRole: {
    ADMIN: "ADMIN",
    CUSTOMER: "CUSTOMER",
  },
}));

// Import after mocks
const { createPortalSession } =
  await import("@/features/billing/services/stripe/create-portal-session.service");

describe("createPortalSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates portal session and returns url", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeBillingPortalCreate.mockResolvedValue({
      url: "https://billing.stripe.com/session/portal_123",
    });

    const result = await createPortalSession({ userId: "user-123" });

    expect(result.url).toBe("https://billing.stripe.com/session/portal_123");
    expect(mockStripeBillingPortalCreate).toHaveBeenCalledWith(
      {
        customer: "cus_123",
        return_url: "https://test.example.com/dashboard/facturation",
      },
      { idempotencyKey: "portal-user-123" },
    );
  });

  it("throws UnauthorizedError if user not found", async () => {
    mockPrismaUserFindUnique.mockResolvedValue(null);

    await expect(
      createPortalSession({ userId: "missing-user" }),
    ).rejects.toThrow(UnauthorizedError);
    await expect(
      createPortalSession({ userId: "missing-user" }),
    ).rejects.toThrow("Utilisateur introuvable");
  });

  it("throws ForbiddenError if email not verified", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      emailVerified: false,
      role: "CUSTOMER",
    });

    await expect(createPortalSession({ userId: "user-123" })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(createPortalSession({ userId: "user-123" })).rejects.toThrow(
      "vérifier votre adresse e-mail",
    );
  });

  it("throws ForbiddenError if role is not CUSTOMER", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      emailVerified: true,
      role: "ADMIN",
    });

    await expect(createPortalSession({ userId: "user-123" })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(createPortalSession({ userId: "user-123" })).rejects.toThrow(
      "rôle CUSTOMER",
    );
  });

  it("throws NotFoundError if no StripeCustomer", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

    await expect(createPortalSession({ userId: "user-123" })).rejects.toThrow(
      NotFoundError,
    );
    await expect(createPortalSession({ userId: "user-123" })).rejects.toThrow(
      "Aucun client Stripe trouvé",
    );
  });

  it("throws BadRequestError if portalSession.url is null", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeBillingPortalCreate.mockResolvedValue({
      url: null,
    });

    await expect(createPortalSession({ userId: "user-123" })).rejects.toThrow(
      BadRequestError,
    );
    await expect(createPortalSession({ userId: "user-123" })).rejects.toThrow(
      "Impossible de créer la session du portail",
    );
  });

  it("selects correct fields from user", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeBillingPortalCreate.mockResolvedValue({
      url: "https://portal.stripe.com",
    });

    await createPortalSession({ userId: "user-123" });

    expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
      select: {
        id: true,
        emailVerified: true,
        role: true,
      },
    });
  });

  it("selects correct fields from stripeCustomer", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeBillingPortalCreate.mockResolvedValue({
      url: "https://portal.stripe.com",
    });

    await createPortalSession({ userId: "user-123" });

    expect(mockPrismaStripeCustomerFindUnique).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      select: { stripeCustomerId: true },
    });
  });
});
