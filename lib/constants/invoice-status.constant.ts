type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void";

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  open: "Ouverte",
  paid: "Payée",
  uncollectible: "Irrécouvrable",
  void: "Annulée",
};

export { invoiceStatusLabels };
export type { InvoiceStatus };
