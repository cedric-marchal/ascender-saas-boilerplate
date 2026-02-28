import Link from "next/link";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";
import { SubscriptionListEmpty } from "@/features/billing/components/subscription-list-empty";
import { SubscriptionStatusCard } from "@/features/billing/components/subscription-status-card";

function BillingEmptyPage() {
  return (
    <Main className="flex flex-col gap-6 p-6">
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
    </Main>
  );
}

export { BillingEmptyPage };
