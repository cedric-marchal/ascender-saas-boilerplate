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
 * Uses the real member row count — never a cached counter — so it stays accurate
 * even after cascade-deletes (account deletion, etc.).
 * Must be called before creating a membership or accepting an invitation.
 */
async function checkSeatCapacity(organizationId: string): Promise<void> {
  const [memberCount, activeSubscription] = await Promise.all([
    prisma.member.count({
      where: {
        organizationId,
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

  // Verify org exists by checking membership (member.count returns 0 for missing org too,
  // so we do a quick existence check via member table — if 0 members AND no subscription
  // the org may not exist; guard via organization lookup)
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!organization) {
    throw new ForbiddenError("errors.organizations.notFound");
  }

  const planConfig = activeSubscription
    ? getPlanByPriceId(activeSubscription.stripePriceId)
    : undefined;

  const seatCap = planConfig?.seatsIncluded ?? FREE_PLAN_SEAT_CAP;

  if (memberCount >= seatCap) {
    throw new ForbiddenError("errors.organizations.seatCapReached", {
      params: { seatCap },
    });
  }
}

export { checkSeatCapacity };
