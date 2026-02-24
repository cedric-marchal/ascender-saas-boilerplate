import "server-only";

import { UserRole } from "@/lib/generated/prisma/client";
import { env } from "@/lib/env";
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
  input: CreatePortalSessionInput
): Promise<CreatePortalSessionResult> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      emailVerified: true,
      role: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Utilisateur introuvable");
  }

  if (!user.emailVerified) {
    throw new ForbiddenError(
      "Vous devez vérifier votre adresse e-mail avant d'accéder au portail de facturation"
    );
  }

  if (user.role !== UserRole.CUSTOMER) {
    throw new ForbiddenError(
      "Seuls les utilisateurs avec le rôle CUSTOMER peuvent accéder au portail de facturation"
    );
  }

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  });

  if (!stripeCustomer) {
    throw new NotFoundError(
      "Aucun client Stripe trouvé. Vous devez d'abord souscrire à un abonnement."
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomer.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_BASE_URL}/dashboard/facturation`,
  });

  if (!portalSession.url) {
    throw new BadRequestError(
      "Impossible de créer la session du portail de facturation"
    );
  }

  return { url: portalSession.url };
}

export { createPortalSession };

export type { CreatePortalSessionInput, CreatePortalSessionResult };
