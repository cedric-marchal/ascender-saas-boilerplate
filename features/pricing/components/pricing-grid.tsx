import { PricingCard } from "@/features/pricing/components/pricing-card";
import {
  getPricingPlans,
  type Plan,
} from "@/features/pricing/constants/pricing-plans";

type PricingGridProps = {
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isCustomer: boolean;
};

async function PricingGrid({
  isAuthenticated,
  isEmailVerified,
  isCustomer,
}: PricingGridProps) {
  const plans = await getPricingPlans();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan: Plan) => (
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
