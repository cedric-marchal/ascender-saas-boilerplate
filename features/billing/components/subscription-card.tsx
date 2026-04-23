import { Calendar, CheckCircle2, XCircle } from "lucide-react";

import { getPlanLabel } from "@/features/billing/constants/plan.constant";
import { subscriptionStatusLabels } from "@/features/billing/constants/subscription-status.constant";
import type { BillingSubscription } from "@/features/billing/services/get-billing.service";

import type { SubscriptionStatus } from "@/lib/generated/prisma/browser";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SubscriptionStatusConfig = {
  label: string;
  variant: "default" | "destructive" | "secondary";
  icon: typeof CheckCircle2;
};

const STATUS_CONFIG: Record<SubscriptionStatus, SubscriptionStatusConfig> = {
  ACTIVE: {
    label: subscriptionStatusLabels.ACTIVE,
    variant: "default",
    icon: CheckCircle2,
  },
  CANCELED: {
    label: subscriptionStatusLabels.CANCELED,
    variant: "destructive",
    icon: XCircle,
  },
  INCOMPLETE: {
    label: subscriptionStatusLabels.INCOMPLETE,
    variant: "secondary",
    icon: XCircle,
  },
  INCOMPLETE_EXPIRED: {
    label: subscriptionStatusLabels.INCOMPLETE_EXPIRED,
    variant: "secondary",
    icon: XCircle,
  },
  PAST_DUE: {
    label: subscriptionStatusLabels.PAST_DUE,
    variant: "destructive",
    icon: XCircle,
  },
  TRIALING: {
    label: subscriptionStatusLabels.TRIALING,
    variant: "default",
    icon: CheckCircle2,
  },
  UNPAID: {
    label: subscriptionStatusLabels.UNPAID,
    variant: "destructive",
    icon: XCircle,
  },
  PAUSED: {
    label: subscriptionStatusLabels.PAUSED,
    variant: "secondary",
    icon: XCircle,
  },
};

function SubscriptionCard({
  subscription,
}: {
  subscription: BillingSubscription;
}) {
  const config = STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.CANCELED;
  const StatusIcon = config.icon;

  const planLabel = getPlanLabel(subscription.priceId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{`Abonnement ${planLabel}`}</CardTitle>
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
                    subscription.currentPeriodStart * 1000,
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
                    subscription.currentPeriodEnd * 1000,
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
                },
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { SubscriptionCard };
