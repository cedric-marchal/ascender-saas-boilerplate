import { FileText } from "lucide-react";

function InvoiceListEmpty() {
  return (
    <section className="rounded-lg border border-dashed py-12 text-center">
      <div className="mx-auto max-w-md space-y-3">
        <FileText
          className="mx-auto h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />
        <h3 className="text-lg font-medium">Aucune facture</h3>
        <p className="text-sm text-muted-foreground">
          Vos factures apparaîtront ici une fois que vous aurez effectué un
          paiement.
        </p>
      </div>
    </section>
  );
}

export { InvoiceListEmpty };
