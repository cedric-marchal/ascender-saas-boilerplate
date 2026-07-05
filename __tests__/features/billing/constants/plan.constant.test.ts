import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_PRICE_ID_PRO: "price_pro_test_123",
  },
}));

const {
  ALLOWED_PRICE_IDS,
  getPlanByPriceId,
  getPlanLabel,
  getPriceIds,
  getSeatsIncluded,
  PLAN_CONFIG,
} = await import("@/features/billing/constants/plan.constant");

const PRO_PRICE_ID = "price_pro_test_123";
const UNKNOWN_PRICE_ID = "price_does_not_exist";

describe("PLAN_CONFIG shape", () => {
  it("is keyed by plan id and every entry carries the required fields", () => {
    for (const key of Object.keys(PLAN_CONFIG)) {
      const plan = PLAN_CONFIG[key as keyof typeof PLAN_CONFIG];

      expect(typeof plan.priceId).toBe("string");
      expect(plan.priceId.length).toBeGreaterThan(0);
      expect(typeof plan.label).toBe("string");
      expect(typeof plan.seatsIncluded).toBe("number");
      expect(Array.isArray(plan.features)).toBe(true);
    }
  });

  it("keeps 'pro' as the only configured plan today", () => {
    expect(Object.keys(PLAN_CONFIG)).toEqual(["pro"]);
  });
});

describe("ALLOWED_PRICE_IDS", () => {
  it("derives every price ID from PLAN_CONFIG (never hardcoded)", () => {
    const expectedPriceIds = Object.values(PLAN_CONFIG).map(
      (plan) => plan.priceId,
    );

    expect(ALLOWED_PRICE_IDS).toEqual(expectedPriceIds);
  });
});

describe("getPlanByPriceId", () => {
  it("resolves a known price ID to its plan config", () => {
    const plan = getPlanByPriceId(PRO_PRICE_ID);

    expect(plan?.seatsIncluded).toBe(5);
    expect(plan?.priceId).toBe(PRO_PRICE_ID);
  });

  it("returns undefined for an unknown price ID (free/default behavior preserved)", () => {
    expect(getPlanByPriceId(UNKNOWN_PRICE_ID)).toBeUndefined();
  });
});

describe("getPlanLabel", () => {
  it("returns the plan label for a known price ID", () => {
    expect(getPlanLabel(PRO_PRICE_ID)).toBe("Pro");
  });

  it("returns null for an unknown price ID", () => {
    expect(getPlanLabel(UNKNOWN_PRICE_ID)).toBeNull();
  });

  it("returns null when the price ID is null", () => {
    expect(getPlanLabel(null)).toBeNull();
  });
});

describe("getSeatsIncluded", () => {
  it("returns the seat count configured for the plan", () => {
    expect(getSeatsIncluded("pro")).toBe(5);
  });
});

describe("getPriceIds", () => {
  it("maps plan keys to their price IDs", () => {
    expect(getPriceIds("pro")).toEqual([PRO_PRICE_ID]);
  });
});
