import { describe, expect, it } from "vitest";

import {
  invoiceStatusLabels,
  type InvoiceStatus,
} from "@/features/billing/constants/invoice-status.constant";

describe("invoiceStatusLabels", () => {
  it("has an entry for all 5 invoice statuses", () => {
    const statuses: InvoiceStatus[] = [
      "draft",
      "open",
      "paid",
      "uncollectible",
      "void",
    ];

    for (const status of statuses) {
      expect(invoiceStatusLabels[status]).toBeDefined();
      expect(typeof invoiceStatusLabels[status]).toBe("string");
    }
  });

  it("maps each status to its own translation key", () => {
    expect(invoiceStatusLabels.draft).toBe("draft");
    expect(invoiceStatusLabels.open).toBe("open");
    expect(invoiceStatusLabels.paid).toBe("paid");
    expect(invoiceStatusLabels.uncollectible).toBe("uncollectible");
    expect(invoiceStatusLabels.void).toBe("void");
  });

  it("has exactly 5 entries", () => {
    const entries = Object.keys(invoiceStatusLabels);
    expect(entries).toHaveLength(5);
  });

  it("is exhaustive (no missing InvoiceStatus)", () => {
    const expectedStatuses: InvoiceStatus[] = [
      "draft",
      "open",
      "paid",
      "uncollectible",
      "void",
    ];
    const labelKeys = Object.keys(invoiceStatusLabels);

    expect(labelKeys.sort()).toEqual(expectedStatuses.sort());
  });
});
