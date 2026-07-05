import "server-only";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/utils/errors/errors";

type CreatePortalSessionInput = {
  organizationId: string;
  userId: string;
};

type CreatePortalSessionResult = {
  url: string;
};

async function createPortalSession(
  input: CreatePortalSessionInput,
): Promise<CreatePortalSessionResult> {
  const member = await prisma.member.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
      role: {
        in: ["owner", "admin"],
      },
    },
    select: {
      id: true,
    },
  });

  if (!member) {
    throw new ForbiddenError("errors.billing.portalAccessForbidden");
  }

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: {
      organizationId: input.organizationId,
    },
    select: {
      stripeCustomerId: true,
    },
  });

  if (!stripeCustomer) {
    throw new NotFoundError("errors.billing.noStripeCustomer");
  }

  const portalSession = await stripe.billingPortal.sessions.create(
    {
      customer: stripeCustomer.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_BASE_URL}/dashboard/facturation`,
    },
    { idempotencyKey: `portal-org-${input.organizationId}` },
  );

  if (!portalSession.url) {
    throw new BadRequestError("errors.billing.portalSessionFailed");
  }

  return {
    url: portalSession.url,
  };
}

export { createPortalSession };

export type { CreatePortalSessionInput, CreatePortalSessionResult };
