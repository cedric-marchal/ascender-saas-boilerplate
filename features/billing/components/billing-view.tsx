import Link from "next/link";

import { BillingPortalButton } from "@/features/billing/components/billing-portal-button";
import { InvoiceList } from "@/features/billing/components/invoice-list";
import { SubscriptionCard } from "@/features/billing/components/subscription-card";
import { SubscriptionListEmpty } from "@/features/billing/components/subscription-list-empty";
import { SubscriptionStatusCard } from "@/features/billing/components/subscription-status-card";
import type {
  BillingSubscription,
  GetBillingResult,
} from "@/features/billing/services/get-billing.service";
import { AlertCircle } from "lucide-react";

import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/constants/subscription-status.constant";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type BillingViewProps = {
  billing: GetBillingResult | null;
};

function BillingView({ billing }: BillingViewProps) {
  if (!billing) {
    return (
      <main className="flex min-h-screen flex-col gap-6 p-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Facturation</h1>
          <p className="text-muted-foreground">
            Gérez vos abonnements et vos informations de paiement
          </p>
        </header>

        <div className="space-y-6">
          <SubscriptionStatusCard subscriptions={[]} />
          <SubscriptionListEmpty />
        </div>

        <div className="flex justify-center">
          <Button type="button" asChild>
            <Link href="/tarifs">Découvrir nos offres</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { invoices, subscriptions } = billing;

  const activeSubscription = subscriptions.find(
    (subscription: BillingSubscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
  );

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Facturation</h1>
        <p className="text-muted-foreground">
          Gérez vos abonnements et vos informations de paiement
        </p>
      </header>

      {subscriptions.length === 0 && (
        <div className="space-y-6">
          <SubscriptionStatusCard subscriptions={[]} />
          <SubscriptionListEmpty />

          {invoices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Historique des factures</h2>
              <InvoiceList invoices={invoices} />
            </div>
          )}

          <div className="flex justify-center">
            <Button type="button" asChild>
              <Link href="/tarifs">Découvrir nos offres</Link>
            </Button>
          </div>
        </div>
      )}

      {subscriptions.length > 0 && (
        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Statut</h2>
                <BillingPortalButton />
              </div>
              <SubscriptionStatusCard subscriptions={subscriptions} />
            </div>

            {activeSubscription && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Abonnement actif</h2>
                <SubscriptionCard subscription={activeSubscription} />

                {activeSubscription.cancelAtPeriodEnd && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <AlertTitle>Abonnement en cours d'annulation</AlertTitle>
                    <AlertDescription>
                      Votre abonnement sera annulé le{" "}
                      {new Date(
                        activeSubscription.currentPeriodEnd * 1000
                      ).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      . Vous pouvez réactiver votre abonnement via le portail de
                      facturation.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Historique des factures</h2>
            <InvoiceList invoices={invoices} />
          </div>

          {subscriptions.filter(
            (subscription: BillingSubscription) =>
              !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
          ).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Anciens abonnements</h2>

              <div className="grid gap-4">
                {subscriptions
                  .filter(
                    (subscription: BillingSubscription) =>
                      !ACTIVE_SUBSCRIPTION_STATUSES.includes(
                        subscription.status
                      )
                  )
                  .map((subscription: BillingSubscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                    />
                  ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export { BillingView };
