import { CheckCircle2, XCircle } from "lucide-react";
import type Stripe from "stripe";

import { env } from "@/lib/env";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SubscriptionStatusCardProps = {
  subscriptions: Stripe.Subscription[];
};

function SubscriptionStatusCard({
  subscriptions,
}: SubscriptionStatusCardProps) {
  const activeSubscription = subscriptions.find(
    (subscription: Stripe.Subscription) =>
      subscription.status === "active" ||
      subscription.status === "trialing" ||
      subscription.status === "past_due"
  ) as (Stripe.Subscription & { current_period_end: number }) | undefined;

  const isProSubscription = activeSubscription
    ? activeSubscription.items.data.some(
        (item: Stripe.SubscriptionItem) =>
          item.price.id === env.STRIPE_PRICE_ID_PRO
      )
    : false;

  const isSubscribed = !!activeSubscription;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statut de votre abonnement</CardTitle>
        <CardDescription>
          Informations sur votre abonnement actuel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Statut</p>
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <>
                  <CheckCircle2
                    className="h-5 w-5 text-green-600"
                    aria-hidden="true"
                  />
                  <span className="text-lg font-semibold text-green-600">
                    Abonné
                  </span>
                </>
              ) : (
                <>
                  <XCircle
                    className="text-muted-foreground h-5 w-5"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground text-lg font-semibold">
                    Non abonné
                  </span>
                </>
              )}
            </div>
          </div>

          {isSubscribed && (
            <Badge variant="default" className="text-base">
              {isProSubscription ? "Plan Pro" : "Plan Inconnu"}
            </Badge>
          )}
        </div>

        {isSubscribed && activeSubscription && (
          <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {activeSubscription.status === "trialing"
                    ? "Période d'essai"
                    : activeSubscription.status === "past_due"
                      ? "Paiement en retard"
                      : "Actif"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renouvellement</span>
                <span className="font-medium">
                  {new Date(
                    activeSubscription.current_period_end * 1000
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              {activeSubscription.cancel_at_period_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annulation</span>
                  <span className="text-destructive font-medium">
                    Fin de période
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { SubscriptionStatusCard };
