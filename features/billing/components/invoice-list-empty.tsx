import { FileText } from "lucide-react";

function InvoiceListEmpty() {
  return (
    <section className="rounded-lg border border-dashed py-12 text-center">
      <div className="mx-auto max-w-md space-y-3">
        <FileText
          className="text-muted-foreground mx-auto h-12 w-12"
          aria-hidden="true"
        />
        <h3 className="text-lg font-medium">Aucune facture</h3>
        <p className="text-muted-foreground text-sm">
          Vos factures apparaîtront ici une fois que vous aurez effectué un
          paiement.
        </p>
      </div>
    </section>
  );
}

export { InvoiceListEmpty };
