import "server-only";

import { env } from "@/lib/env";
import { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@/utils/errors/errors";

type StripeUser = {
  id: string;
  email: string;
  name: string;
};

type CreateCheckoutSessionInput = {
  userId: string;
  priceId: string;
};

type CreateCheckoutSessionResult = {
  url: string;
};

async function syncStripeCustomerIfNeeded(
  stripeCustomerId: string,
  user: StripeUser,
): Promise<void> {
  try {
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

    if (stripeCustomer.deleted) {
      throw new BadRequestError(
        "Votre compte Stripe a été supprimé. Veuillez contacter le support.",
      );
    }

    if (
      stripeCustomer.email !== user.email ||
      stripeCustomer.name !== user.name
    ) {
      await stripe.customers.update(stripeCustomerId, {
        email: user.email,
        name: user.name,
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          `Stripe customer synchronized during checkout for user ${user.id}`,
        );
      }
    }
  } catch (error: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `Failed to sync Stripe customer during checkout for user ${user.id}:`,
        error,
      );
    }
  }
}

async function getOrCreateStripeCustomer(user: StripeUser): Promise<string> {
  const existingStripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  });

  if (existingStripeCustomer) {
    await syncStripeCustomerIfNeeded(
      existingStripeCustomer.stripeCustomerId,
      user,
    );
    return existingStripeCustomer.stripeCustomerId;
  }

  const stripeCustomer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id,
    },
  });

  await prisma.stripeCustomer.create({
    data: {
      userId: user.id,
      stripeCustomerId: stripeCustomer.id,
    },
  });

  return stripeCustomer.id;
}

async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      role: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Utilisateur introuvable");
  }

  if (!user.emailVerified) {
    throw new ForbiddenError(
      "Vous devez vérifier votre adresse e-mail avant de souscrire à un abonnement",
    );
  }

  if (user.role !== UserRole.CUSTOMER) {
    throw new ForbiddenError(
      "Seuls les utilisateurs avec le rôle CUSTOMER peuvent souscrire à un abonnement",
    );
  }

  if (input.priceId !== env.STRIPE_PRICE_ID_PRO) {
    throw new BadRequestError("Prix invalide ou non autorisé");
  }

  const stripeCustomerId = await getOrCreateStripeCustomer({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  const existingSubscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 1,
  });

  if (existingSubscriptions.data.length > 0) {
    throw new ConflictError(
      "Vous avez déjà un abonnement actif. Gérez-le depuis votre espace facturation.",
    );
  }

  const stripeSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price: input.priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${env.NEXT_PUBLIC_BASE_URL}/dashboard/facturation?success=true`,
    cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/tarifs?canceled=true`,
    metadata: {
      userId: user.id,
    },
  });

  if (!stripeSession.url) {
    throw new BadRequestError("Impossible de créer la session de paiement");
  }

  return { url: stripeSession.url };
}

export { createCheckoutSession };

export type { CreateCheckoutSessionInput, CreateCheckoutSessionResult };
