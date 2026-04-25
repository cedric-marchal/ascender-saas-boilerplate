import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn();
const mockRequireCustomer = vi.fn();
const mockSubscriptionFindFirst = vi.fn();

vi.mock("react", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    cache: (fn: unknown) => fn,
  };
});

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/session", () => ({
  requireCustomer: mockRequireCustomer,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findFirst: mockSubscriptionFindFirst,
    },
  },
}));

vi.mock("@/features/billing/constants/subscription-status.constant", () => ({
  ACTIVE_SUBSCRIPTION_STATUSES: ["ACTIVE", "TRIALING", "PAST_DUE"],
}));

vi.mock("@/features/billing/constants/plan.constant", () => ({
  ALLOWED_PRICE_IDS: ["price_pro_test"],
  getPriceIds: (...plans: string[]) => plans.map(() => "price_pro_test"),
}));

const { requireCustomerPlan } =
  await import("@/features/billing/guards/require-customer-plan");

const makeSession = (overrides: { id?: string } = {}) => ({
  user: {
    id: overrides.id ?? "user-123",
    email: "user@example.com",
    name: "Test User",
    role: "CUSTOMER",
    emailVerified: true,
  },
  session: { id: "session-123", expiresAt: new Date() },
});

describe("requireCustomerPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /tarifs if no active subscription", async () => {
    mockRequireCustomer.mockResolvedValue(makeSession());
    mockSubscriptionFindFirst.mockResolvedValue(null);

    await requireCustomerPlan("pro");

    expect(mockRedirect).toHaveBeenCalledWith("/tarifs");
  });

  it("returns session if active subscription exists", async () => {
    mockRequireCustomer.mockResolvedValue(makeSession());
    mockSubscriptionFindFirst.mockResolvedValue({ id: "sub-123" });

    const result = await requireCustomerPlan("pro");

    expect(result?.user.role).toBe("CUSTOMER");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("uses all paid plans when called without arguments", async () => {
    mockRequireCustomer.mockResolvedValue(makeSession());
    mockSubscriptionFindFirst.mockResolvedValue({ id: "sub-123" });

    const result = await requireCustomerPlan();

    expect(result?.user.role).toBe("CUSTOMER");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
