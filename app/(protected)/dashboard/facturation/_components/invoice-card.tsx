import type Stripe from "stripe";
import { Calendar, Download, FileText } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InvoiceCardProps = {
  invoice: Stripe.Invoice;
};

function InvoiceCard({ invoice }: InvoiceCardProps) {
  const statusConfig: Record<
    Stripe.Invoice.Status,
    {
      label: string;
      variant: "default" | "destructive" | "secondary";
    }
  > = {
    draft: {
      label: "Brouillon",
      variant: "secondary",
    },
    open: {
      label: "Ouverte",
      variant: "secondary",
    },
    paid: {
      label: "Payée",
      variant: "default",
    },
    uncollectible: {
      label: "Irrécouvrable",
      variant: "destructive",
    },
    void: {
      label: "Annulée",
      variant: "destructive",
    },
  };

  const config = invoice.status
    ? statusConfig[invoice.status]
    : statusConfig.draft;

  const formatAmount = (amount: number | null) => {
    if (amount === null) return "0,00 €";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "eur",
    }).format(amount / 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-base">
                Facture {invoice.number || invoice.id}
              </CardTitle>
            </div>
            <CardDescription>
              {invoice.created
                ? new Date(invoice.created * 1000).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Date inconnue"}
            </CardDescription>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {formatAmount(invoice.amount_paid)}
            </p>
            {invoice.status === "paid" && invoice.status_transitions?.paid_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>
                  Payé le{" "}
                  {new Date(
                    invoice.status_transitions.paid_at * 1000
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {invoice.invoice_pdf && (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link
                href={invoice.invoice_pdf}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Télécharger
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { InvoiceCard };
