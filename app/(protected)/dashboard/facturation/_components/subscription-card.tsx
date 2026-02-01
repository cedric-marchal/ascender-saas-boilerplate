import type Stripe from "stripe";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SubscriptionCardProps = {
  subscription: Stripe.Subscription;
};

function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const sub = subscription as Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
  };

  const statusConfig: Record<
    Stripe.Subscription.Status,
    {
      label: string;
      variant: "default" | "destructive" | "secondary";
      icon: typeof CheckCircle2;
    }
  > = {
    active: {
      label: "Actif",
      variant: "default",
      icon: CheckCircle2,
    },
    canceled: {
      label: "Annulé",
      variant: "destructive",
      icon: XCircle,
    },
    incomplete: {
      label: "Incomplet",
      variant: "secondary",
      icon: XCircle,
    },
    incomplete_expired: {
      label: "Expiré",
      variant: "secondary",
      icon: XCircle,
    },
    past_due: {
      label: "En retard",
      variant: "destructive",
      icon: XCircle,
    },
    trialing: {
      label: "Essai",
      variant: "default",
      icon: CheckCircle2,
    },
    unpaid: {
      label: "Impayé",
      variant: "destructive",
      icon: XCircle,
    },
    paused: {
      label: "En pause",
      variant: "secondary",
      icon: XCircle,
    },
  };

  const config = statusConfig[sub.status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Abonnement Pro</CardTitle>
            <CardDescription>ID: {sub.id}</CardDescription>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Début de période</span>
            </div>
            <p className="text-sm font-medium">
              {sub.current_period_start
                ? new Date(
                    sub.current_period_start * 1000
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Date inconnue"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Fin de période</span>
            </div>
            <p className="text-sm font-medium">
              {sub.current_period_end
                ? new Date(
                    sub.current_period_end * 1000
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Date inconnue"}
            </p>
          </div>
        </div>

        {sub.canceled_at && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              <span>Annulé le</span>
            </div>
            <p className="text-sm font-medium">
              {new Date(sub.canceled_at * 1000).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { SubscriptionCard };
