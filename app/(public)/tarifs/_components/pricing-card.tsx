import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { type Plan } from "@/app/(public)/tarifs/_components/pricing-plans";
import { PricingCheckoutButton } from "@/app/(public)/tarifs/_components/pricing-checkout-button";
import { PricingContactButton } from "@/app/(public)/tarifs/_components/pricing-contact-button";
import { PricingFreeButton } from "@/app/(public)/tarifs/_components/pricing-free-button";

type PricingCardProps = {
  plan: Plan;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isCustomer: boolean;
};

function PricingCard({
  plan,
  isAuthenticated,
  isEmailVerified,
  isCustomer,
}: PricingCardProps) {
  return (
    <Card
      className={
        plan.featured
          ? "border-primary/40 ring-primary/20 ring-1"
          : "border-muted"
      }
    >
      <CardHeader>
        {plan.featured && (
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">
            Populaire
          </p>
        )}
        <CardTitle className="text-base">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="mt-auto space-y-4 text-sm">
        <div className="space-y-1">
          <p className="text-2xl font-semibold">
            {plan.price === "Sur mesure" ? (
              plan.price
            ) : (
              <>
                {plan.price} €
                <span className="text-muted-foreground text-xs font-normal">
                  {" "}
                  / {plan.period}
                </span>
              </>
            )}
          </p>
        </div>

        <ul className="text-muted-foreground space-y-1">
          {plan.features.map((feature: string) => (
            <li key={feature}>• {feature}</li>
          ))}
        </ul>

        {plan.isFree ? (
          <PricingFreeButton>{plan.cta}</PricingFreeButton>
        ) : plan.priceId ? (
          <PricingCheckoutButton
            priceId={plan.priceId}
            isAuthenticated={isAuthenticated}
            isEmailVerified={isEmailVerified}
            isCustomer={isCustomer}
            featured={plan.featured}
          >
            {plan.cta}
          </PricingCheckoutButton>
        ) : (
          <PricingContactButton>{plan.cta}</PricingContactButton>
        )}
      </CardContent>
    </Card>
  );
}

export { PricingCard };
