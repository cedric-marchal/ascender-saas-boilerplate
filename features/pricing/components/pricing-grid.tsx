import { PricingCard } from "@/features/pricing/components/pricing-card";
import { PLANS, type Plan } from "@/features/pricing/constants/pricing-plans";

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
