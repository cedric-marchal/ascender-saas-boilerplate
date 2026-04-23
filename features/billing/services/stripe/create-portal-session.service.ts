import "server-only";

import { env } from "@/lib/env";
import { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors/errors";

type CreatePortalSessionInput = {
  userId: string;
};

type CreatePortalSessionResult = {
  url: string;
};

async function createPortalSession(
  input: CreatePortalSessionInput,
): Promise<CreatePortalSessionResult> {
  const [user, stripeCustomer] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: input.userId,
      },
      select: {
        id: true,
        emailVerified: true,
        role: true,
      },
    }),
    prisma.stripeCustomer.findUnique({
      where: {
        userId: input.userId,
      },
      select: {
        stripeCustomerId: true,
      },
    }),
  ]);

  if (!user) {
    throw new UnauthorizedError("Utilisateur introuvable");
  }

  if (!user.emailVerified) {
    throw new ForbiddenError(
      "Vous devez vérifier votre adresse e-mail avant d'accéder au portail de facturation",
    );
  }

  if (user.role !== UserRole.CUSTOMER) {
    throw new ForbiddenError(
      "Seuls les utilisateurs avec le rôle CUSTOMER peuvent accéder au portail de facturation",
    );
  }

  if (!stripeCustomer) {
    throw new NotFoundError(
      "Aucun client Stripe trouvé. Vous devez d'abord souscrire à un abonnement.",
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create(
    {
      customer: stripeCustomer.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_BASE_URL}/dashboard/facturation`,
    },
    { idempotencyKey: `portal-${input.userId}` },
  );

  if (!portalSession.url) {
    throw new BadRequestError(
      "Impossible de créer la session du portail de facturation",
    );
  }

  return {
    url: portalSession.url,
  };
}

export { createPortalSession };

export type { CreatePortalSessionInput, CreatePortalSessionResult };
