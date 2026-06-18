import "server-only";

import { ALLOWED_PRICE_IDS } from "@/features/billing/constants/plan.constant";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/utils/errors/errors";

type CreateCheckoutSessionInput = {
  organizationId: string;
  userId: string;
  priceId: string;
};

type CreateCheckoutSessionResult = {
  url: string;
};

async function syncStripeCustomerIfNeeded(
  stripeCustomerId: string,
  organizationName: string,
  organizationId: string,
): Promise<void> {
  try {
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

    if (stripeCustomer.deleted) {
      throw new BadRequestError(
        "Votre compte Stripe a été supprimé. Veuillez contacter le support.",
      );
    }

    if (stripeCustomer.name !== organizationName) {
      await stripe.customers.update(stripeCustomerId, {
        name: organizationName,
      });

      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Stripe customer synchronized during checkout for organization ${organizationId}`,
        );
      }
    }
  } catch (error: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `Failed to sync Stripe customer during checkout for organization ${organizationId}:`,
        error,
      );
    }
  }
}

async function getOrCreateStripeCustomer(input: {
  organizationId: string;
  organizationName: string;
}): Promise<string> {
  const existingStripeCustomer = await prisma.stripeCustomer.findUnique({
    where: {
      organizationId: input.organizationId,
    },
    select: {
      stripeCustomerId: true,
    },
  });

  if (existingStripeCustomer) {
    await syncStripeCustomerIfNeeded(
      existingStripeCustomer.stripeCustomerId,
      input.organizationName,
      input.organizationId,
    );

    return existingStripeCustomer.stripeCustomerId;
  }

  const stripeCustomer = await stripe.customers.create(
    {
      name: input.organizationName,
      metadata: {
        organizationId: input.organizationId,
      },
    },
    {
      idempotencyKey: `stripe-org-customer-${input.organizationId}`,
    },
  );

  try {
    await prisma.stripeCustomer.create({
      data: {
        organizationId: input.organizationId,
        stripeCustomerId: stripeCustomer.id,
      },
    });
  } catch (error: unknown) {
    const existingRecord = await prisma.stripeCustomer.findUnique({
      where: {
        organizationId: input.organizationId,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (existingRecord) {
      return existingRecord.stripeCustomerId;
    }

    await stripe.customers.del(stripeCustomer.id).catch(() => {});
    throw error;
  }

  return stripeCustomer.id;
}

async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> {
  const organization = await prisma.organization.findUnique({
    where: {
      id: input.organizationId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organization) {
    throw new NotFoundError("Organisation introuvable");
  }

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
    throw new ForbiddenError(
      "Seuls les propriétaires et administrateurs peuvent gérer la facturation",
    );
  }

  if (!ALLOWED_PRICE_IDS.includes(input.priceId)) {
    throw new BadRequestError("Prix invalide ou non autorisé");
  }

  const stripeCustomerId = await getOrCreateStripeCustomer({
    organizationId: organization.id,
    organizationName: organization.name,
  });

  const existingSubscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 1,
  });

  if (existingSubscriptions.data.length > 0) {
    throw new ConflictError(
      "Cette organisation a déjà un abonnement actif. Gérez-le depuis votre espace facturation.",
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
      organizationId: organization.id,
    },
  });

  if (!stripeSession.url) {
    throw new BadRequestError("Impossible de créer la session de paiement");
  }

  return {
    url: stripeSession.url,
  };
}

export { createCheckoutSession };

export type { CreateCheckoutSessionInput, CreateCheckoutSessionResult };
