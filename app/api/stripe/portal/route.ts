import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";

async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    if (user.role !== "CUSTOMER") {
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

    return NextResponse.json(
      { success: true, data: { url: portalSession.url } },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
