import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { parseUserRole } from "@/lib/constants/user-role.constant";
import { env } from "@/lib/env";
import type { SubscriptionStatus } from "@/lib/generated/prisma/client";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type RawSession = typeof auth.$Infer.Session;

type Session = Omit<RawSession, "user"> & {
  user: Omit<RawSession["user"], "role"> & {
    role: UserRole;
  };
};

const VALID_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
];

/**
 * Récupère la session (mémorisée pendant le rendu)
 * Retourne null si non connecté
 */
const getSession = async (): Promise<Session | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: parseUserRole(session.user.role),
    },
  };
};

/**
 * Récupère la session ou redirige vers connexion
 * À utiliser dans CHAQUE page protégée
 */
const requireSession = async (): Promise<Session> => {
  const session = await getSession();

  if (!session) {
    return redirect("/connexion");
  }

  return session;
};

/**
 * Récupère la session customer ou affiche 404
 * À utiliser dans les pages customer ne nécessitant pas d'email vérifié
 */
const requireCustomer = async (): Promise<Session> => {
  const session = await requireSession();

  if (session.user.role !== "CUSTOMER") {
    return notFound();
  }

  return session;
};

/**
 * Récupère la session customer et vérifie que l'email est vérifié
 * Redirige vers /dashboard/parametres si l'email n'est pas vérifié
 * À utiliser dans les pages customer nécessitant un email vérifié
 */
const requireCustomerVerifiedEmail = async (): Promise<Session> => {
  const session = await requireCustomer();

  if (!session.user.emailVerified) {
    return redirect("/dashboard/parametres");
  }

  return session;
};

const requireCustomerProSubscription = async (): Promise<Session> => {
  const session = await requireCustomer();

  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeCustomer: {
        userId: session.user.id,
      },
      stripePriceId: env.STRIPE_PRICE_ID_PRO,
      status: {
        in: VALID_SUBSCRIPTION_STATUSES,
      },
    },
    select: {
      id: true,
    },
  });

  if (!subscription) {
    return redirect("/tarifs");
  }

  return session;
};

/**
 * Récupère la session admin ou affiche 404
 * À utiliser dans les pages admin ne nécessitant pas d'email vérifié
 */
const requireAdmin = async (): Promise<Session> => {
  const session = await requireSession();

  if (session.user.role !== "ADMIN") {
    return notFound();
  }

  return session;
};

/**
 * Récupère la session admin et vérifie que l'email est vérifié
 * Affiche 404 si non admin ou si l'email n'est pas vérifié
 * À utiliser dans les pages admin nécessitant un email vérifié
 */
const requireAdminVerifiedEmail = async (): Promise<Session> => {
  const session = await requireAdmin();

  if (!session.user.emailVerified) {
    return redirect("/admin/parametres");
  }

  return session;
};

export {
  getSession,
  requireAdmin,
  requireAdminVerifiedEmail,
  requireCustomer,
  requireCustomerProSubscription,
  requireCustomerVerifiedEmail,
  requireSession,
};

export type { Session };
