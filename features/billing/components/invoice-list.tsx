import { InvoiceCard } from "@/features/billing/components/invoice-card";
import { InvoiceListEmpty } from "@/features/billing/components/invoice-list-empty";
import type { BillingInvoice } from "@/features/billing/queries/get-billing";

type InvoiceListProps = {
  invoices: BillingInvoice[];
};

function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return <InvoiceListEmpty />;
  }

  return (
    <div className="grid gap-4">
      {invoices.map((invoice: BillingInvoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
}

export { InvoiceList };
