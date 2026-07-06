import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/utils/errors/errors";

const mockSubscriptionFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findFirst: mockSubscriptionFindFirst,
    },
  },
}));

vi.mock("@/features/billing/constants/plan.constant", () => ({
  ALLOWED_PRICE_IDS: ["price_pro_test"],
  getPriceIds: (...plans: string[]) =>
    plans.map((plan: string) => `price_${plan}_test`),
}));

const { requireOrganizationPlan } =
  await import("@/features/billing/guards/require-organization-plan");

const ORGANIZATION_ID = "org-1";

describe("requireOrganizationPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ForbiddenError when the organization has no active plan", async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null);

    await expect(
      requireOrganizationPlan(ORGANIZATION_ID, "pro"),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      requireOrganizationPlan(ORGANIZATION_ID, "pro"),
    ).rejects.toThrow("errors.billing.planRequired");
  });

  it("resolves when an active subscription exists", async () => {
    mockSubscriptionFindFirst.mockResolvedValue({ id: "sub-1" });

    await expect(
      requireOrganizationPlan(ORGANIZATION_ID, "pro"),
    ).resolves.toBeUndefined();
  });

  it("scopes the lookup to the organization and the requested plan's price", async () => {
    mockSubscriptionFindFirst.mockResolvedValue({ id: "sub-1" });

    await requireOrganizationPlan(ORGANIZATION_ID, "pro");

    expect(mockSubscriptionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          stripeCustomer: { organizationId: ORGANIZATION_ID },
          stripePriceId: { in: ["price_pro_test"] },
        }),
      }),
    );
  });
});
