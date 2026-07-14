type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void";

/**
 * Values are translation KEYS (resolved against the `billing.invoiceStatuses`
 * message namespace via `useTranslations`), not literal labels.
 */
const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "draft",
  open: "open",
  paid: "paid",
  uncollectible: "uncollectible",
  void: "void",
};

export { invoiceStatusLabels };
export type { InvoiceStatus };
