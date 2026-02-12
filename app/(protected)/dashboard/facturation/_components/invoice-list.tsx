import type { BillingInvoice } from "@/app/(protected)/dashboard/facturation/_lib/get-billing";

import { InvoiceCard } from "@/app/(protected)/dashboard/facturation/_components/invoice-card";
import { InvoiceListEmpty } from "@/app/(protected)/dashboard/facturation/_components/invoice-list-empty";

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
