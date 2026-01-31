import { CreditCard } from "lucide-react";

function SubscriptionListEmpty() {
  return (
    <section className="py-12 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <CreditCard
          className="mx-auto h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Aucun abonnement actif</h3>
          <p className="text-muted-foreground text-sm">
            Vous n'avez pas encore d'abonnement. Découvrez nos offres pour
            commencer à utiliser toutes les fonctionnalités.
          </p>
        </div>
      </div>
    </section>
  );
}

export { SubscriptionListEmpty };
