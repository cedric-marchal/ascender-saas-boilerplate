import "server-only";

import { cache } from "react";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ROLE_DASHBOARD_URL } from "@/features/auth/constants/role-dashboard.constant";
import {
  ALLOWED_PRICE_IDS,
  getPriceIds,
  type PlanKey,
} from "@/features/billing/constants/plan.constant";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/features/billing/constants/subscription-status.constant";

import { auth } from "@/lib/auth";
import { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type RawSession = typeof auth.$Infer.Session;

type Session = Omit<RawSession, "user"> & {
  user: Omit<RawSession["user"], "role"> & {
    role: UserRole;
  };
};

function parseUserRole(role: string): UserRole {
  if (!Object.values(UserRole).includes(role as UserRole)) {
    throw new Error(`Role invalide dans la session: ${role}`);
  }

  return role as UserRole;
}

/**
 * Récupère la session (mémorisée pendant le rendu)
 * Retourne null si non connecté
 */
const getSession = cache(async (): Promise<Session | null> => {
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
});

/**
 * Vérifie que l'utilisateur n'est pas connecté (visiteur)
 * Redirige vers le dashboard approprié selon le rôle si connecté
 * À utiliser dans les pages publiques réservées aux visiteurs (connexion, inscription, etc.)
 */
const requireGuest = async (): Promise<void> => {
  const session = await getSession();

  if (session) {
    redirect(ROLE_DASHBOARD_URL[session.user.role]);
  }
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

  if (session.user.role !== UserRole.CUSTOMER) {
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

const getActiveSubscription = cache(
  async (userId: string, priceIds: string[]) => {
    return prisma.subscription.findFirst({
      where: {
        stripeCustomer: {
          userId,
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
    });
  },
);

const requireCustomerPlan = async (...plans: PlanKey[]): Promise<Session> => {
  const priceIds = plans.length > 0 ? getPriceIds(...plans) : ALLOWED_PRICE_IDS;
  const session = await requireCustomer();
  const subscription = await getActiveSubscription(session.user.id, priceIds);

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

  if (session.user.role !== UserRole.ADMIN) {
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
  requireCustomerPlan,
  requireCustomerVerifiedEmail,
  requireGuest,
  requireSession,
};

export type { Session };
