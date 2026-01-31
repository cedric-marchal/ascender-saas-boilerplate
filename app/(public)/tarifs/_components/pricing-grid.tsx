import { type Plan, PLANS } from "@/app/(public)/tarifs/_components/pricing-plans";
import { PricingCard } from "@/app/(public)/tarifs/_components/pricing-card";

type PricingGridProps = {
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isCustomer: boolean;
};

function PricingGrid({
  isAuthenticated,
  isEmailVerified,
  isCustomer,
}: PricingGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((plan: Plan) => (
        <PricingCard
          key={plan.name}
          plan={plan}
          isAuthenticated={isAuthenticated}
          isEmailVerified={isEmailVerified}
          isCustomer={isCustomer}
        />
      ))}
    </div>
  );
}

export { PricingGrid };
