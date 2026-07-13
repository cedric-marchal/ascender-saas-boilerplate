import "server-only";

import {
  ALLOWED_PRICE_IDS,
  getPriceIds,
  type PlanKey,
} from "@/features/billing/constants/plan.constant";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/features/billing/constants/subscription-status.constant";

import { prisma } from "@/lib/prisma";

import { ForbiddenError } from "@/utils/errors/errors";

/**
 * Action/service-side counterpart to `requireCustomerPlan` (which redirects and
 * is page-only). Throws `ForbiddenError` when the organization has no active
 * paid subscription for the given plan(s).
 *
 * Use this at the entry point of EVERY mutation that backs a plan-gated feature,
 * so the paywall is enforced on WRITE — not only on the read page. A page guard
 * alone is bypassable: server actions are directly invocable POST endpoints.
 *
 * Pass the same plan key(s) the page uses (e.g. `"pro"`); omit to accept any
 * active paid plan.
 */
async function requireOrganizationPlan(
  organizationId: string,
  ...plans: PlanKey[]
): Promise<void> {
  const priceIds = plans.length > 0 ? getPriceIds(...plans) : ALLOWED_PRICE_IDS;

  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeCustomer: {
        organizationId,
      },
      stripePriceId: {
        in: priceIds,
      },
      status: {
        in: ACTIVE_SUBSCRIPTION_STATUSES,
      },
    },
    select: {
      id: true,
    },
  });

  if (!subscription) {
    throw new ForbiddenError("errors.billing.planRequired");
  }
}

export { requireOrganizationPlan };
