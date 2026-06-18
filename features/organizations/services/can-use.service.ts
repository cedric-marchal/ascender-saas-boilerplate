import "server-only";

import { PLAN_CONFIG } from "@/features/billing/constants/plan.constant";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/features/billing/constants/subscription-status.constant";
import {
  FEATURE_CONFIG,
  type FeatureKey,
} from "@/features/organizations/constants/feature-config.constant";

import { prisma } from "@/lib/prisma";

/**
 * Returns true if the organization has an active subscription that includes
 * the given feature. Returns false for unknown features or free plan.
 */
async function canUse(
  organizationId: string,
  feature: FeatureKey,
): Promise<boolean> {
  const featureConfig = FEATURE_CONFIG[feature];

  if (!featureConfig) {
    return false;
  }

  const allowedPriceIds = featureConfig.plans
    .map((planKey) => PLAN_CONFIG[planKey]?.priceId)
    .filter((priceId): priceId is string => Boolean(priceId));

  if (allowedPriceIds.length === 0) {
    return false;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeCustomer: {
        organizationId,
      },
      stripePriceId: {
        in: allowedPriceIds,
      },
      status: {
        in: ACTIVE_SUBSCRIPTION_STATUSES,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(subscription);
}

export { canUse };
