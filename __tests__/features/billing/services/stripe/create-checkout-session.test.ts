import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@/utils/errors/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockPrismaUserFindUnique = vi.fn();
const mockPrismaStripeCustomerFindUnique = vi.fn();
const mockPrismaStripeCustomerCreate = vi.fn();
const mockStripeCustomersRetrieve = vi.fn();
const mockStripeCustomersUpdate = vi.fn();
const mockStripeCustomersCreate = vi.fn();
const mockStripeSubscriptionsList = vi.fn();
const mockStripeCheckoutCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockPrismaUserFindUnique,
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

vi.mock("@/lib/constants/roles.constant", () => ({
  UserRole: {
    ADMIN: "ADMIN",
    CUSTOMER: "CUSTOMER",
  },
}));

// Import after mocks
const { createCheckoutSession } = await import(
  "@/features/billing/services/stripe/create-checkout-session.service"
);

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates session and returns url", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "John Doe",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      deleted: false,
      email: "user@example.com",
      name: "John Doe",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session_123",
    });

    const result = await createCheckoutSession({
      userId: "user-123",
      priceId: "price_pro_123",
    });

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
      success_url: "https://test.example.com/dashboard/facturation?success=true",
      cancel_url: "https://test.example.com/tarifs?canceled=true",
      metadata: {
        userId: "user-123",
      },
    });
  });

  it("throws UnauthorizedError if user not found", async () => {
    mockPrismaUserFindUnique.mockResolvedValue(null);

    await expect(
      createCheckoutSession({
        userId: "missing-user",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow(UnauthorizedError);
    await expect(
      createCheckoutSession({
        userId: "missing-user",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow("Utilisateur introuvable");
  });

  it("throws ForbiddenError if email not verified", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "John Doe",
      emailVerified: false,
      role: "CUSTOMER",
    });

    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow(ForbiddenError);
    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow("vérifier votre adresse e-mail");
  });

  it("throws ForbiddenError if role is not CUSTOMER", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "John Doe",
      emailVerified: true,
      role: "ADMIN",
    });

    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow(ForbiddenError);
    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow("rôle CUSTOMER");
  });

  it("throws BadRequestError if priceId invalid", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "John Doe",
      emailVerified: true,
      role: "CUSTOMER",
    });

    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_invalid",
      })
    ).rejects.toThrow(BadRequestError);
    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_invalid",
      })
    ).rejects.toThrow("Prix invalide");
  });

  it("throws ConflictError if active subscription exists", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "John Doe",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      deleted: false,
      email: "user@example.com",
      name: "John Doe",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [{ id: "sub_active" }],
    });

    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow(ConflictError);
    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow("déjà un abonnement actif");
  });

  it("creates Stripe customer if not exists", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "newuser@example.com",
      name: "New User",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

    mockStripeCustomersCreate.mockResolvedValue({
      id: "cus_new",
    });

    mockPrismaStripeCustomerCreate.mockResolvedValue({
      userId: "user-123",
      stripeCustomerId: "cus_new",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/new",
    });

    await createCheckoutSession({
      userId: "user-123",
      priceId: "price_pro_123",
    });

    expect(mockStripeCustomersCreate).toHaveBeenCalledWith({
      email: "newuser@example.com",
      name: "New User",
      metadata: {
        userId: "user-123",
      },
    });

    expect(mockPrismaStripeCustomerCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        stripeCustomerId: "cus_new",
      },
    });
  });

  it("syncs existing Stripe customer if email/name changed", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "updated@example.com",
      name: "Updated Name",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      deleted: false,
      email: "old@example.com",
      name: "Old Name",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session",
    });

    await createCheckoutSession({
      userId: "user-123",
      priceId: "price_pro_123",
    });

    expect(mockStripeCustomersUpdate).toHaveBeenCalledWith("cus_123", {
      email: "updated@example.com",
      name: "Updated Name",
    });
  });

  it("does not sync if email/name unchanged", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "same@example.com",
      name: "Same Name",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      deleted: false,
      email: "same@example.com",
      name: "Same Name",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session",
    });

    await createCheckoutSession({
      userId: "user-123",
      priceId: "price_pro_123",
    });

    expect(mockStripeCustomersUpdate).not.toHaveBeenCalled();
  });

  it("handles Stripe customer deleted gracefully", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "John Doe",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_deleted",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_deleted",
      deleted: true,
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session",
    });

    // The sync function catches the error internally, so checkout should still work
    const result = await createCheckoutSession({
      userId: "user-123",
      priceId: "price_pro_123",
    });

    expect(result.url).toBe("https://checkout.stripe.com/session");
  });

  it("throws BadRequestError if session.url is null", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "John Doe",
      emailVerified: true,
      role: "CUSTOMER",
    });

    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    mockStripeCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      deleted: false,
      email: "user@example.com",
      name: "John Doe",
    });

    mockStripeSubscriptionsList.mockResolvedValue({
      data: [],
    });

    mockStripeCheckoutCreate.mockResolvedValue({
      url: null,
    });

    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow(BadRequestError);
    await expect(
      createCheckoutSession({
        userId: "user-123",
        priceId: "price_pro_123",
      })
    ).rejects.toThrow("Impossible de créer la session de paiement");
  });
});
