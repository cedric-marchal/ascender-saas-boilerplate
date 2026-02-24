import {
  type InvoiceStatus,
  invoiceStatusLabels,
} from "@/features/billing/constants/invoice-status.constant";
import { describe, expect, it } from "vitest";

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

  it("has French labels", () => {
    expect(invoiceStatusLabels.draft).toBe("Brouillon");
    expect(invoiceStatusLabels.open).toBe("Ouverte");
    expect(invoiceStatusLabels.paid).toBe("Payée");
    expect(invoiceStatusLabels.uncollectible).toBe("Irrécouvrable");
    expect(invoiceStatusLabels.void).toBe("Annulée");
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
