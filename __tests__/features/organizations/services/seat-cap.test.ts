import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/utils/errors/errors";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE importing services
// ---------------------------------------------------------------------------

const mockMemberCount = vi.fn();
const mockOrganizationFindUnique = vi.fn();
const mockSubscriptionFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      count: mockMemberCount,
    },
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

// Helper: set up standard mock returns for a scenario
function setupMocks({
  memberCount,
  subscription,
  orgExists = true,
}: {
  memberCount: number;
  subscription: { stripePriceId: string } | null;
  orgExists?: boolean;
}) {
  mockMemberCount.mockResolvedValue(memberCount);
  mockSubscriptionFindFirst.mockResolvedValue(subscription);
  mockOrganizationFindUnique.mockResolvedValue(
    orgExists ? { id: ORG_ID } : null,
  );
}

// ---------------------------------------------------------------------------
// Tests: checkSeatCapacity — free plan
// ---------------------------------------------------------------------------

describe("checkSeatCapacity — free plan enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows invite when org has 0 real members (free plan — cap = 1)", async () => {
    setupMocks({ memberCount: 0, subscription: null });

    await expect(checkSeatCapacity(ORG_ID)).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when free plan org already has 1 real member (cap = 1)", async () => {
    setupMocks({ memberCount: FREE_PLAN_CAP, subscription: null });

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when free plan org has more than 1 real member", async () => {
    setupMocks({ memberCount: 3, subscription: null });

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when org is not found", async () => {
    setupMocks({ memberCount: 0, subscription: null, orgExists: false });

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

  it("allows invite when pro plan org has 4 real members (cap = 5)", async () => {
    setupMocks({
      memberCount: 4,
      subscription: { stripePriceId: PRO_PRICE_ID },
    });

    await expect(checkSeatCapacity(ORG_ID)).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when pro plan org is at 5 real members (cap = 5)", async () => {
    setupMocks({
      memberCount: PRO_PLAN_CAP,
      subscription: { stripePriceId: PRO_PRICE_ID },
    });

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when pro plan org has 6 real members (over cap)", async () => {
    setupMocks({
      memberCount: 6,
      subscription: { stripePriceId: PRO_PRICE_ID },
    });

    await expect(checkSeatCapacity(ORG_ID)).rejects.toThrow(ForbiddenError);
  });

  it("allows invite on pro plan below cap (1 real member)", async () => {
    setupMocks({
      memberCount: 1,
      subscription: { stripePriceId: PRO_PRICE_ID },
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

  it("queries REAL member row count by organizationId (not a cached counter)", async () => {
    setupMocks({ memberCount: 0, subscription: null });

    await checkSeatCapacity(ORG_ID);

    // MUST use prisma.member.count, NOT organization.seatsUsed
    expect(mockMemberCount).toHaveBeenCalledWith({
      where: { organizationId: ORG_ID },
    });

    // Regression guard: if someone reverts to seatsUsed counter,
    // organization.findUnique must NOT be used for the seat comparison.
    // (It IS called for existence check, but must NOT select seatsUsed.)
    expect(mockOrganizationFindUnique).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      select: { id: true },
    });
  });

  it("REGRESSION: does NOT read seatsUsed from organization", async () => {
    setupMocks({ memberCount: 0, subscription: null });

    await checkSeatCapacity(ORG_ID);

    // Ensure the organization.findUnique call never selects seatsUsed
    const orgCalls = mockOrganizationFindUnique.mock.calls;

    for (const call of orgCalls) {
      const selectArg = call[0]?.select as Record<string, unknown> | undefined;

      expect(selectArg).not.toHaveProperty("seatsUsed");
    }
  });

  it("queries subscription scoped to organizationId", async () => {
    setupMocks({ memberCount: 0, subscription: null });

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
    mockMemberCount.mockResolvedValueOnce(1);
    mockSubscriptionFindFirst.mockResolvedValueOnce(null);
    mockOrganizationFindUnique.mockResolvedValueOnce({ id: ORG_A });

    await expect(checkSeatCapacity(ORG_A)).rejects.toThrow(ForbiddenError);

    // Org B below cap (0), free plan
    mockMemberCount.mockResolvedValueOnce(0);
    mockSubscriptionFindFirst.mockResolvedValueOnce(null);
    mockOrganizationFindUnique.mockResolvedValueOnce({ id: ORG_B });

    await expect(checkSeatCapacity(ORG_B)).resolves.toBeUndefined();

    // Verify each call used the correct org ID in member.count
    expect(mockMemberCount.mock.calls[0]![0].where.organizationId).toBe(ORG_A);
    expect(mockMemberCount.mock.calls[1]![0].where.organizationId).toBe(ORG_B);
  });
});

// ---------------------------------------------------------------------------
// Tests: checkSeatCapacity — real member row count (not stale counter)
// ---------------------------------------------------------------------------

describe("checkSeatCapacity — uses real member row count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cap is enforced against real member count — pro org exactly at cap throws", async () => {
    // Simulate a pro org exactly at its cap (5 real members)
    setupMocks({
      memberCount: PRO_PLAN_CAP,
      subscription: { stripePriceId: PRO_PRICE_ID },
    });

    const error = await checkSeatCapacity(ORG_ID).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as ForbiddenError).message).toBe(
      "errors.organizations.seatCapReached",
    );
    expect((error as ForbiddenError).params).toEqual({
      seatCap: PRO_PLAN_CAP,
    });

    // Confirm the count was read from member rows, not organization.seatsUsed
    expect(mockMemberCount).toHaveBeenCalledTimes(1);
  });

  it("cap message includes the plan limit for user-facing clarity", async () => {
    setupMocks({ memberCount: FREE_PLAN_CAP, subscription: null });

    const error = await checkSeatCapacity(ORG_ID).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as ForbiddenError).params).toEqual({
      seatCap: FREE_PLAN_CAP,
    });

    // Confirm we counted real members
    expect(mockMemberCount).toHaveBeenCalledTimes(1);
  });

  it("REGRESSION: reverted seatsUsed counter would break this test (member.count never called)", async () => {
    // This test documents the invariant: mockMemberCount MUST be called.
    // If someone reverts to reading organization.seatsUsed and removes member.count,
    // this test will fail — making the regression visible.
    setupMocks({ memberCount: 0, subscription: null });

    await checkSeatCapacity(ORG_ID);

    expect(mockMemberCount).toHaveBeenCalledTimes(1);
    expect(mockMemberCount).toHaveBeenCalledWith({
      where: { organizationId: ORG_ID },
    });
  });
});
