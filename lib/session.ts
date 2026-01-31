import "server-only";

import { cache } from "react";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type Session = typeof auth.$Infer.Session;

/**
 * Récupère la session (mémorisée pendant le rendu)
 * Retourne null si non connecté
 */
const getSession = cache(async (): Promise<Session | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
});

/**
 * Récupère la session ou redirige vers connexion
 * À utiliser dans CHAQUE page protégée
 */
const requireSession = cache(async (): Promise<Session> => {
  const session = await getSession();

  if (!session) {
    return redirect("/connexion");
  }

  return session;
});

/**
 * Récupère la session customer ou affiche 404
 * À utiliser dans les pages customer ne nécessitant pas d'email vérifié
 */
const requireCustomer = cache(async (): Promise<Session> => {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!user || user.role !== "CUSTOMER") {
    return notFound();
  }

  return session;
});

/**
 * Récupère la session customer et vérifie que l'email est vérifié
 * Redirige vers /dashboard/parametres si l'email n'est pas vérifié
 * À utiliser dans les pages customer nécessitant un email vérifié
 */
const requireCustomerVerifiedEmail = cache(async (): Promise<Session> => {
  const session = await requireCustomer();

  if (!session.user.emailVerified) {
    return redirect("/dashboard/parametres");
  }

  return session;
});

/**
 * Récupère la session customer et vérifie qu'il est abonné à la version Pro
 * Redirige vers /tarifs si l'utilisateur n'a pas d'abonnement actif
 * À utiliser dans les pages customer nécessitant un abonnement Pro
 *
 * Statuts acceptés (accès autorisé):
 * - active: Abonnement payé et actif
 * - trialing: Période d'essai avec ou sans paiement configuré
 * - past_due: Paiement échoué mais Stripe réessaie (généralement 3-4 jours)
 *
 * Statuts refusés (redirige vers /tarifs):
 * - incomplete: Paiement initial jamais réussi
 * - incomplete_expired: Premier paiement échoué après 23h
 * - canceled: Abonnement expiré (période payée terminée)
 * - unpaid: Tous les essais de paiement ont échoué
 * - paused: Trial gratuit terminé sans moyen de paiement
 */
const requireCustomerProSubscription = cache(async (): Promise<Session> => {
  const session = await requireCustomer();

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      stripeCustomerId: true,
    },
  });

  if (!stripeCustomer) {
    return redirect("/tarifs");
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomer.stripeCustomerId,
    status: "all",
    limit: 100,
  });

  const hasValidSubscription = subscriptions.data.some(
    (subscription) =>
      subscription.status === "active" ||
      subscription.status === "trialing" ||
      subscription.status === "past_due"
  );

  if (!hasValidSubscription) {
    return redirect("/tarifs");
  }

  return session;
});

/**
 * Récupère la session admin ou affiche 404
 * À utiliser dans les pages admin ne nécessitant pas d'email vérifié
 */
const requireAdmin = cache(async (): Promise<Session> => {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return notFound();
  }

  return session;
});

/**
 * Récupère la session admin et vérifie que l'email est vérifié
 * Affiche 404 si non admin ou si l'email n'est pas vérifié
 * À utiliser dans les pages admin nécessitant un email vérifié
 */
const requireAdminVerifiedEmail = cache(async (): Promise<Session> => {
  const session = await requireAdmin();

  if (!session.user.emailVerified) {
    return redirect("/admin/parametres");
  }

  return session;
});

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
