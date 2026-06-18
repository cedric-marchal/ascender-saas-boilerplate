import Link from "next/link";

import { AlertCircle, CreditCard, Users } from "lucide-react";

import { BillingPortalButton } from "@/features/billing/components/billing-portal-button";
import { InvoiceList } from "@/features/billing/components/invoice-list";
import { SubscriptionCard } from "@/features/billing/components/subscription-card";
import { SubscriptionListEmpty } from "@/features/billing/components/subscription-list-empty";
import { SubscriptionStatusCard } from "@/features/billing/components/subscription-status-card";
import { getPlanLabel } from "@/features/billing/constants/plan.constant";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/features/billing/constants/subscription-status.constant";
import type {
  BillingSubscription,
  GetBillingResult,
} from "@/features/billing/services/get-billing.service";

import { Main } from "@/components/main";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type OrganizationBillingPageProps = {
  billing: GetBillingResult;
  organizationName: string;
  memberCount: number;
  plan: string;
};

function OrganizationBillingPage({
  billing,
  organizationName,
  memberCount,
  plan,
}: OrganizationBillingPageProps) {
  const { invoices, subscriptions } = billing;

  const activeSubscription = subscriptions.find(
    (subscription: BillingSubscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
  );

  const inactiveSubscriptions = subscriptions.filter(
    (subscription: BillingSubscription) =>
      !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
  );

  const planLabel = activeSubscription?.priceId
    ? getPlanLabel(activeSubscription.priceId)
    : "Gratuit";

  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <CreditCard
              className="size-5 text-emerald-500"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Facturation
            </h1>
            <p className="text-muted-foreground text-sm">
              {organizationName} — Plan {planLabel}
            </p>
          </div>
        </div>
        {subscriptions.length > 0 && <BillingPortalButton />}
      </header>

      <Separator />

      <div className="flex items-center gap-3 rounded-lg border p-4">
        <Users className="text-muted-foreground size-5" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-medium">Membres actifs</p>
          <p className="text-muted-foreground text-sm">
            {memberCount} membre{memberCount > 1 ? "s" : ""} dans
            l&apos;organisation
          </p>
        </div>
        <Badge variant="secondary">{plan}</Badge>
      </div>

      {subscriptions.length === 0 && (
        <div className="space-y-6">
          <SubscriptionStatusCard subscriptions={[]} />
          <SubscriptionListEmpty />

          {invoices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Historique des factures</h2>
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
              <h2 className="text-lg font-semibold">Statut</h2>
              <SubscriptionStatusCard subscriptions={subscriptions} />
            </div>

            {activeSubscription && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Abonnement actif</h2>
                <SubscriptionCard subscription={activeSubscription} />

                {activeSubscription.cancelAtPeriodEnd && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" aria-hidden="true" />
                    <AlertTitle>
                      Abonnement en cours d&apos;annulation
                    </AlertTitle>
                    <AlertDescription>
                      Votre abonnement sera annulé le{" "}
                      {new Date(
                        activeSubscription.currentPeriodEnd * 1000,
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
            <h2 className="text-lg font-semibold">Historique des factures</h2>
            <InvoiceList invoices={invoices} />
          </div>

          {inactiveSubscriptions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Anciens abonnements</h2>

              <div className="grid gap-4">
                {inactiveSubscriptions.map(
                  (subscription: BillingSubscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </Main>
  );
}

export { OrganizationBillingPage };
