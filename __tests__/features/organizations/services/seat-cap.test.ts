import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/utils/errors/errors";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE importing services
// ---------------------------------------------------------------------------

const mockOrganizationFindUnique = vi.fn();
const mockSubscriptionFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: mockOrganizationFindUnique,
    },
    subscription: {
      findFirst: mockSubscriptionFindFirst,
    },
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_PRICE_ID_PRO: "price_pro_test_123",
  },
}));

// Import service AFTER mocks
const { checkSeatCapacity } =
  await import("@/features/organizations/services/check-seat-capacity.service");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG_ID = "org-test-1";
const FREE_PLAN_CAP = 1;
const PRO_PLAN_CAP = 5;
const PRO_PRICE_ID = "price_pro_test_123";

// ---------------------------------------------------------------------------
// Tests: checkSeatCapacity — free plan
// ---------------------------------------------------------------------------

describe("checkSeatCapacity — free plan enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows invite when org has 0 seats used (free plan — cap = 1)", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: 0 });
    mockSubscriptionFindFirst.mockResolvedValue(null); // No active subscription

    await expect(checkSeatCapacity(ORG_ID)).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when free plan org already has 1 member (cap = 1)", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: FREE_PLAN_CAP });
    mockSubscriptionFindFirst.mockResolvedValue(null); // No active subscription

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when free plan org has more than 1 member", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: 3 });
    mockSubscriptionFindFirst.mockResolvedValue(null);

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when org is not found", async () => {
    mockOrganizationFindUnique.mockResolvedValue(null);
    mockSubscriptionFindFirst.mockResolvedValue(null);

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// Tests: checkSeatCapacity — pro plan
// ---------------------------------------------------------------------------

describe("checkSeatCapacity — pro plan enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows invite when pro plan org has 4 seats used (cap = 5)", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: 4 });
    mockSubscriptionFindFirst.mockResolvedValue({
      stripePriceId: PRO_PRICE_ID,
    });

    await expect(checkSeatCapacity(ORG_ID)).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when pro plan org is at 5 seats (cap = 5)", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: PRO_PLAN_CAP });
    mockSubscriptionFindFirst.mockResolvedValue({
      stripePriceId: PRO_PRICE_ID,
    });

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when pro plan org is over cap (6 seats)", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: 6 });
    mockSubscriptionFindFirst.mockResolvedValue({
      stripePriceId: PRO_PRICE_ID,
    });

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });

  it("allows invite on pro plan below cap (1 seat)", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: 1 });
    mockSubscriptionFindFirst.mockResolvedValue({
      stripePriceId: PRO_PRICE_ID,
    });

    await expect(checkSeatCapacity(ORG_ID)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: checkSeatCapacity — IDOR scope check
// ---------------------------------------------------------------------------

describe("checkSeatCapacity — org scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries org by organizationId (not userId)", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: 0 });
    mockSubscriptionFindFirst.mockResolvedValue(null);

    await checkSeatCapacity(ORG_ID);

    // Must query org by id
    expect(mockOrganizationFindUnique).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      select: { seatsUsed: true },
    });
  });

  it("queries subscription scoped to organizationId", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: 0 });
    mockSubscriptionFindFirst.mockResolvedValue(null);

    await checkSeatCapacity(ORG_ID);

    // Subscription query must be scoped to org via stripeCustomer.organizationId
    expect(mockSubscriptionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          stripeCustomer: expect.objectContaining({
            organizationId: ORG_ID,
          }),
        }),
      }),
    );
  });

  it("IDOR gate — cap enforced per-org: different org IDs produce independent results", async () => {
    const ORG_A = "org-a";
    const ORG_B = "org-b";

    // Org A at cap (1), free plan
    mockOrganizationFindUnique.mockResolvedValueOnce({ seatsUsed: 1 });
    mockSubscriptionFindFirst.mockResolvedValueOnce(null);

    await expect(checkSeatCapacity(ORG_A)).rejects.toThrow(ForbiddenError);

    // Org B below cap (0), free plan
    mockOrganizationFindUnique.mockResolvedValueOnce({ seatsUsed: 0 });
    mockSubscriptionFindFirst.mockResolvedValueOnce(null);

    await expect(checkSeatCapacity(ORG_B)).resolves.toBeUndefined();

    // Verify each call used the correct org ID
    expect(mockOrganizationFindUnique.mock.calls[0]![0].where.id).toBe(ORG_A);
    expect(mockOrganizationFindUnique.mock.calls[1]![0].where.id).toBe(ORG_B);
  });
});

// ---------------------------------------------------------------------------
// Tests: membershipLimit path (Better Auth direct accept-invitation)
// ---------------------------------------------------------------------------

describe("checkSeatCapacity — membershipLimit integration (direct Better Auth path)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cap is enforced via checkSeatCapacity which is reused for the membershipLimit function", async () => {
    // The membershipLimit function in lib/auth.ts uses the same plan lookup
    // as checkSeatCapacity. This test verifies that logic is sound:
    // when seatsUsed >= cap, the ForbiddenError is thrown.

    // Simulate a pro org exactly at its cap
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: PRO_PLAN_CAP });
    mockSubscriptionFindFirst.mockResolvedValue({
      stripePriceId: PRO_PRICE_ID,
    });

    const error = await checkSeatCapacity(ORG_ID).catch(
      (error: unknown) => error,
    );

    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as ForbiddenError).message).toContain(String(PRO_PLAN_CAP));
  });

  it("cap message includes the plan limit for user-facing clarity", async () => {
    mockOrganizationFindUnique.mockResolvedValue({ seatsUsed: FREE_PLAN_CAP });
    mockSubscriptionFindFirst.mockResolvedValue(null); // Free plan

    const error = await checkSeatCapacity(ORG_ID).catch(
      (error: unknown) => error,
    );

    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as ForbiddenError).message).toContain(String(FREE_PLAN_CAP));
  });
});
