import { PricingGrid } from "@/features/pricing/components/pricing-grid";
import { getPricingUserStatus } from "@/features/pricing/services/get-pricing-user-status.service";

import { getSession } from "@/lib/session";

async function PricingCta() {
  const session = await getSession();

  const { isAuthenticated, isEmailVerified, isCustomer } =
    await getPricingUserStatus(session?.user.id ?? null);

  return (
    <PricingGrid
      isAuthenticated={isAuthenticated}
      isEmailVerified={isEmailVerified}
      isCustomer={isCustomer}
    />
  );
}

export { PricingCta };
