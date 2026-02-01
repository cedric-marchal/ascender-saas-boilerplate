import type { Metadata } from "next";
import Link from "next/link";

import { AlertCircle } from "lucide-react";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { requireCustomerVerifiedEmail } from "@/lib/session";
import { stripe } from "@/lib/stripe";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { BillingPortalButton } from "@/app/(protected)/dashboard/facturation/_components/billing-portal-button";
import { InvoiceList } from "@/app/(protected)/dashboard/facturation/_components/invoice-list";
import { SubscriptionCard } from "@/app/(protected)/dashboard/facturation/_components/subscription-card";
import { SubscriptionListEmpty } from "@/app/(protected)/dashboard/facturation/_components/subscription-list-empty";
import { SubscriptionStatusCard } from "@/app/(protected)/dashboard/facturation/_components/subscription-status-card";

export const metadata: Metadata = {
  title: "Facturation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardBillingPage() {
  const session = await requireCustomerVerifiedEmail();

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!stripeCustomer) {
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

  const invoicesCacheKey = `invoices:${session.user.id}`;
  const cachedInvoices = await redis.get<Stripe.Invoice[]>(invoicesCacheKey);

  let invoices: Stripe.Invoice[];

  if (cachedInvoices) {
    invoices = cachedInvoices;
  } else {
    const { data: fetchedInvoices } = await stripe.invoices.list({
      customer: stripeCustomer.stripeCustomerId,
      limit: 100,
    });
    await redis.set(invoicesCacheKey, fetchedInvoices, { ex: 300 });
    invoices = fetchedInvoices;
  }

  const { data: subscriptions } = await stripe.subscriptions.list({
    customer: stripeCustomer.stripeCustomerId,
    limit: 100,
  });

  const activeSubscription = subscriptions.find(
    (subscription: Stripe.Subscription) => subscription.status === "active"
  ) as
    | (Stripe.Subscription & {
        current_period_end: number;
        cancel_at_period_end: boolean;
      })
    | undefined;

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

                {activeSubscription.cancel_at_period_end && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <AlertTitle>Abonnement en cours d'annulation</AlertTitle>
                    <AlertDescription>
                      Votre abonnement sera annulé le{" "}
                      {new Date(
                        activeSubscription.current_period_end * 1000
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
            (subscription: Stripe.Subscription) =>
              subscription.status !== "active"
          ).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Anciens abonnements</h2>

              <div className="grid gap-4">
                {subscriptions
                  .filter(
                    (subscription: Stripe.Subscription) =>
                      subscription.status !== "active"
                  )
                  .map((subscription: Stripe.Subscription) => (
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
