import Link from "next/link";

import { CreditCard } from "lucide-react";

import { SubscriptionListEmpty } from "@/features/billing/components/subscription-list-empty";
import { SubscriptionStatusCard } from "@/features/billing/components/subscription-status-card";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function BillingEmptyPage() {
  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <CreditCard className="size-5 text-emerald-500" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturation</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos abonnements et vos informations de paiement
          </p>
        </div>
      </header>

      <Separator />

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
