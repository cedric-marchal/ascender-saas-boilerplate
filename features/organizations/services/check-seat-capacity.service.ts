import "server-only";

import {
  ALLOWED_PRICE_IDS,
  getPlanByPriceId,
} from "@/features/billing/constants/plan.constant";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/features/billing/constants/subscription-status.constant";

import { prisma } from "@/lib/prisma";

import { ForbiddenError } from "@/utils/errors/errors";

// Default seat cap for free plan (no subscription)
const FREE_PLAN_SEAT_CAP = 1;

/**
 * Throws ForbiddenError if adding one more member would exceed the plan's seat cap.
 * Must be called before creating a membership or accepting an invitation.
 */
async function checkSeatCapacity(organizationId: string): Promise<void> {
  const [organization, activeSubscription] = await Promise.all([
    prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        seatsUsed: true,
      },
    }),
    prisma.subscription.findFirst({
      where: {
        stripeCustomer: {
          organizationId,
        },
        stripePriceId: {
          in: ALLOWED_PRICE_IDS,
        },
        status: {
          in: ACTIVE_SUBSCRIPTION_STATUSES,
        },
      },
      select: {
        stripePriceId: true,
      },
      orderBy: {
        currentPeriodEnd: "desc",
      },
    }),
  ]);

  if (!organization) {
    throw new ForbiddenError("Organisation introuvable");
  }

  const planConfig = activeSubscription
    ? getPlanByPriceId(activeSubscription.stripePriceId)
    : undefined;

  const seatCap = planConfig?.seatsIncluded ?? FREE_PLAN_SEAT_CAP;

  if (organization.seatsUsed >= seatCap) {
    throw new ForbiddenError(
      `Votre plan ne permet pas d'ajouter plus de ${seatCap} membre${seatCap > 1 ? "s" : ""}. Passez à un plan supérieur pour inviter davantage de membres.`,
    );
  }
}

export { checkSeatCapacity };
