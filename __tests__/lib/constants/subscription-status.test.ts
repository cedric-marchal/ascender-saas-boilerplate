import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  ALL_SUBSCRIPTION_STATUSES,
  subscriptionStatusLabels,
} from "@/features/billing/constants/subscription-status.constant";
import type { SubscriptionStatus } from "@/lib/generated/prisma/client";
import { describe, expect, it } from "vitest";

describe("subscriptionStatusLabels", () => {
  it("has an entry for each SubscriptionStatus", () => {
    const statuses: SubscriptionStatus[] = [
      "incomplete",
      "incomplete_expired",
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "paused",
    ];

    for (const status of statuses) {
      expect(subscriptionStatusLabels[status]).toBeDefined();
      expect(typeof subscriptionStatusLabels[status]).toBe("string");
    }
  });

  it("has French labels", () => {
    expect(subscriptionStatusLabels.incomplete).toBe("Incomplet");
    expect(subscriptionStatusLabels.incomplete_expired).toBe("Expiré");
    expect(subscriptionStatusLabels.trialing).toBe("Essai");
    expect(subscriptionStatusLabels.active).toBe("Actif");
    expect(subscriptionStatusLabels.past_due).toBe("En retard");
    expect(subscriptionStatusLabels.canceled).toBe("Annulé");
    expect(subscriptionStatusLabels.unpaid).toBe("Impayé");
    expect(subscriptionStatusLabels.paused).toBe("En pause");
  });

  it("has exactly 8 entries", () => {
    const entries = Object.keys(subscriptionStatusLabels);
    expect(entries).toHaveLength(8);
  });
});

describe("ACTIVE_SUBSCRIPTION_STATUSES", () => {
  it("contains exactly active, trialing, past_due", () => {
    expect(ACTIVE_SUBSCRIPTION_STATUSES).toEqual([
      "active",
      "trialing",
      "past_due",
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
      "incomplete",
      "incomplete_expired",
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "paused",
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
