import "server-only";

import { cache } from "react";

import { redirect } from "next/navigation";

import {
  ALLOWED_PRICE_IDS,
  getPriceIds,
  type PlanKey,
} from "@/features/billing/constants/plan.constant";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/features/billing/constants/subscription-status.constant";

import { prisma } from "@/lib/prisma";
import { requireCustomer, type Session } from "@/lib/session";

const getActiveSubscription = cache(
  async (organizationId: string, priceIds: string[]) => {
    return prisma.subscription.findFirst({
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
      orderBy: {
        currentPeriodEnd: "desc",
      },
    });
  },
);

async function requireCustomerPlan(...plans: PlanKey[]): Promise<Session> {
  const priceIds = plans.length > 0 ? getPriceIds(...plans) : ALLOWED_PRICE_IDS;
  const session = await requireCustomer();
  const organizationId = session.activeOrganizationId;

  if (!organizationId) {
    return redirect("/tarifs");
  }

  const subscription = await getActiveSubscription(organizationId, priceIds);

  if (!subscription) {
    return redirect("/tarifs");
  }

  return session;
}

export { requireCustomerPlan };
