import { describe, expect, it } from "vitest";

import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  ALL_SUBSCRIPTION_STATUSES,
  subscriptionStatusLabels,
} from "@/features/billing/constants/subscription-status.constant";

import type { SubscriptionStatus } from "@/lib/generated/prisma/client";

describe("subscriptionStatusLabels", () => {
  it("has an entry for each SubscriptionStatus", () => {
    const statuses: SubscriptionStatus[] = [
      "INCOMPLETE",
      "INCOMPLETE_EXPIRED",
      "TRIALING",
      "ACTIVE",
      "PAST_DUE",
      "CANCELED",
      "UNPAID",
      "PAUSED",
    ];

    for (const status of statuses) {
      expect(subscriptionStatusLabels[status]).toBeDefined();
      expect(typeof subscriptionStatusLabels[status]).toBe("string");
    }
  });

  it("maps each status to its own translation key", () => {
    expect(subscriptionStatusLabels.INCOMPLETE).toBe("INCOMPLETE");
    expect(subscriptionStatusLabels.INCOMPLETE_EXPIRED).toBe(
      "INCOMPLETE_EXPIRED",
    );
    expect(subscriptionStatusLabels.TRIALING).toBe("TRIALING");
    expect(subscriptionStatusLabels.ACTIVE).toBe("ACTIVE");
    expect(subscriptionStatusLabels.PAST_DUE).toBe("PAST_DUE");
    expect(subscriptionStatusLabels.CANCELED).toBe("CANCELED");
    expect(subscriptionStatusLabels.UNPAID).toBe("UNPAID");
    expect(subscriptionStatusLabels.PAUSED).toBe("PAUSED");
  });

  it("has exactly 8 entries", () => {
    const entries = Object.keys(subscriptionStatusLabels);
    expect(entries).toHaveLength(8);
  });
});

describe("ACTIVE_SUBSCRIPTION_STATUSES", () => {
  it("contains exactly ACTIVE, TRIALING, PAST_DUE", () => {
    expect(ACTIVE_SUBSCRIPTION_STATUSES).toEqual([
      "ACTIVE",
      "TRIALING",
      "PAST_DUE",
    ]);
  });

  it("has 3 statuses", () => {
    expect(ACTIVE_SUBSCRIPTION_STATUSES).toHaveLength(3);
  });

  it("contains only valid SubscriptionStatus values", () => {
    for (const status of ACTIVE_SUBSCRIPTION_STATUSES) {
      expect(subscriptionStatusLabels[status]).toBeDefined();
    }
  });
});

describe("ALL_SUBSCRIPTION_STATUSES", () => {
  it("contains all 8 subscription statuses", () => {
    expect(ALL_SUBSCRIPTION_STATUSES).toEqual([
      "INCOMPLETE",
      "INCOMPLETE_EXPIRED",
      "TRIALING",
      "ACTIVE",
      "PAST_DUE",
      "CANCELED",
      "UNPAID",
      "PAUSED",
    ]);
  });

  it("has exactly 8 entries", () => {
    expect(ALL_SUBSCRIPTION_STATUSES).toHaveLength(8);
  });

  it("matches subscriptionStatusLabels keys", () => {
    const labelKeys = Object.keys(subscriptionStatusLabels);

    expect(ALL_SUBSCRIPTION_STATUSES.sort()).toEqual(labelKeys.sort());
  });
});
