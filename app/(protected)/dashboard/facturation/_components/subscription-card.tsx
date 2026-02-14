import { Calendar, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { BillingSubscription } from "@/app/(protected)/dashboard/facturation/_lib/get-billing";

type SubscriptionStatusConfig = {
  label: string;
  variant: "default" | "destructive" | "secondary";
  icon: typeof CheckCircle2;
};

const STATUS_CONFIG: Record<string, SubscriptionStatusConfig> = {
  active: { label: "Actif", variant: "default", icon: CheckCircle2 },
  canceled: { label: "Annulé", variant: "destructive", icon: XCircle },
  incomplete: { label: "Incomplet", variant: "secondary", icon: XCircle },
  incomplete_expired: { label: "Expiré", variant: "secondary", icon: XCircle },
  past_due: { label: "En retard", variant: "destructive", icon: XCircle },
  trialing: { label: "Essai", variant: "default", icon: CheckCircle2 },
  unpaid: { label: "Impayé", variant: "destructive", icon: XCircle },
  paused: { label: "En pause", variant: "secondary", icon: XCircle },
};

type SubscriptionCardProps = {
  subscription: BillingSubscription;
};

function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const config = STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.canceled;
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Abonnement Pro</CardTitle>
            <CardDescription>ID: {subscription.id}</CardDescription>
          </div>
          <Badge variant={config.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Début de période</span>
            </div>
            <p className="text-sm font-medium">
              {subscription.currentPeriodStart
                ? new Date(
                    subscription.currentPeriodStart * 1000
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Date inconnue"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Fin de période</span>
            </div>
            <p className="text-sm font-medium">
              {subscription.currentPeriodEnd
                ? new Date(
                    subscription.currentPeriodEnd * 1000
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Date inconnue"}
            </p>
          </div>
        </div>

        {subscription.canceledAt && (
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              <span>Annulé le</span>
            </div>
            <p className="text-sm font-medium">
              {new Date(subscription.canceledAt * 1000).toLocaleDateString(
                "fr-FR",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { SubscriptionCard };
