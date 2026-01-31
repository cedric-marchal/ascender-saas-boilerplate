import type { Metadata } from "next";
import Link from "next/link";

import type Stripe from "stripe";
import { AlertCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireCustomerVerifiedEmail } from "@/lib/session";
import { stripe } from "@/lib/stripe";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { BillingPortalButton } from "@/app/(protected)/dashboard/facturation/_components/billing-portal-button";
import { SubscriptionCard } from "@/app/(protected)/dashboard/facturation/_components/subscription-card";
import { SubscriptionListEmpty } from "@/app/(protected)/dashboard/facturation/_components/subscription-list-empty";

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
          <h1 className="text-3xl font-semibold tracking-tight">
            Facturation
          </h1>
          <p className="text-muted-foreground">
            Gérez vos abonnements et vos informations de paiement
          </p>
        </header>

        <SubscriptionListEmpty />

        <div className="flex justify-center">
          <Button type="button" asChild>
            <Link href="/tarifs">Découvrir nos offres</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { data: subscriptions } = await stripe.subscriptions.list({
    customer: stripeCustomer.stripeCustomerId,
    limit: 100,
  });

  const activeSubscription = subscriptions.find(
    (subscription: Stripe.Subscription) => subscription.status === "active"
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
        <>
          <SubscriptionListEmpty />

          <div className="flex justify-center">
            <Button type="button" asChild>
              <Link href="/tarifs">Découvrir nos offres</Link>
            </Button>
          </div>
        </>
      )}

      {subscriptions.length > 0 && (
        <section className="space-y-6">
          {activeSubscription && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Abonnement actif</h2>
                <BillingPortalButton />
              </div>

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

          {subscriptions.filter(
            (subscription: Stripe.Subscription) =>
              subscription.status !== "active"
          ).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Historique</h2>

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
