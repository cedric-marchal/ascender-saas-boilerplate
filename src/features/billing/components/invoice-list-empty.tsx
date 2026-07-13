import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";

function InvoiceListEmpty() {
  const t = useTranslations("billing.invoiceListEmpty");

  return (
    <section className="rounded-lg border border-dashed py-12 text-center">
      <div className="mx-auto max-w-md space-y-3">
        <FileText
          className="text-muted-foreground mx-auto h-12 w-12"
          aria-hidden="true"
        />
        <h3 className="text-lg font-medium">{t("title")}</h3>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
    </section>
  );
}

export { InvoiceListEmpty };
