import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { Calendar, Download, FileText } from "lucide-react";
import { useLocale, useTranslations, type Locale } from "next-intl";

import {
  invoiceStatusLabels,
  type InvoiceStatus,
} from "@/features/billing/constants/invoice-status.constant";
import type { BillingInvoice } from "@/features/billing/services/get-billing.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InvoiceStatusConfig = {
  label: string;
  variant: "default" | "destructive" | "secondary";
};

const STATUS_CONFIG: Record<InvoiceStatus, InvoiceStatusConfig> = {
  draft: {
    label: invoiceStatusLabels.draft,
    variant: "secondary",
  },
  open: {
    label: invoiceStatusLabels.open,
    variant: "secondary",
  },
  paid: {
    label: invoiceStatusLabels.paid,
    variant: "default",
  },
  uncollectible: {
    label: invoiceStatusLabels.uncollectible,
    variant: "destructive",
  },
  void: {
    label: invoiceStatusLabels.void,
    variant: "destructive",
  },
};

function formatAmount(amount: number | null, bcp47: string): string {
  return new Intl.NumberFormat(bcp47, {
    style: "currency",
    currency: "eur",
  }).format((amount ?? 0) / 100);
}

function InvoiceCard({ invoice }: { invoice: BillingInvoice }) {
  const t = useTranslations("billing.invoiceCard");
  const tStatuses = useTranslations("billing.invoiceStatuses");
  const locale = useLocale();
  const bcp47 = LOCALE_METADATA[locale as Locale].bcp47;

  const config = invoice.status
    ? (STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft)
    : STATUS_CONFIG.draft;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText
                className="text-muted-foreground h-4 w-4"
                aria-hidden="true"
              />
              <CardTitle className="text-base">
                {t("titlePrefix", { number: invoice.number || invoice.id })}
              </CardTitle>
            </div>
            <CardDescription>
              {invoice.created
                ? new Date(invoice.created * 1000).toLocaleDateString(bcp47, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : t("unknownDate")}
            </CardDescription>
          </div>
          <Badge variant={config.variant}>{tStatuses(config.label)}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {formatAmount(invoice.amountPaid, bcp47)}
            </p>
            {invoice.status === "paid" && invoice.paidAt && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>
                  {t("paidOn", {
                    date: new Date(invoice.paidAt * 1000).toLocaleDateString(
                      bcp47,
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    ),
                  })}
                </span>
              </div>
            )}
          </div>

          {invoice.invoicePdfUrl && (
            <Button
              render={
                <a
                  href={invoice.invoicePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              type="button"
              variant="outline"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("download")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { InvoiceCard };
