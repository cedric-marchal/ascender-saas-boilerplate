import "server-only";

import { cache } from "react";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import type Stripe from "stripe";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

type Session = typeof auth.$Infer.Session;

const SUBSCRIPTION_CACHE_TTL = 120;

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
 * Redirige vers /tarifs si l'utilisateur n'a pas d'abonnement Pro actif
 * À utiliser dans les pages customer nécessitant un abonnement Pro
 *
 * Performance:
 * - Utilise un cache Redis avec TTL de 120 secondes
 * - Invalidation instantanée via webhooks Stripe (subscription.created/updated/deleted)
 * - Cache hit: ~5-10ms (pas d'appel Stripe)
 * - Cache miss: ~200-500ms (appel API Stripe + mise en cache)
 * - Changement d'abonnement: invalidation immédiate du cache
 *
 * Vérifications effectuées:
 * 1. L'abonnement doit contenir le price_id du plan Pro (STRIPE_PRICE_ID_PRO)
 * 2. L'abonnement doit avoir un statut valide
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

  const cacheKey = `subscription:${session.user.id}:pro`;
  const cached = await redis.get<string>(cacheKey);

  if (cached === "valid") {
    return session;
  }

  if (cached === "invalid") {
    return redirect("/tarifs");
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.stripeCustomerId,
      status: "all",
      limit: 100,
    });

    const hasValidProSubscription = subscriptions.data.some(
      (subscription: Stripe.Subscription) => {
        const hasProPrice = subscription.items.data.some(
          (item: Stripe.SubscriptionItem) =>
            item.price.id === env.STRIPE_PRICE_ID_PRO
        );

        const isValidStatus =
          subscription.status === "active" ||
          subscription.status === "trialing" ||
          subscription.status === "past_due";

        return hasProPrice && isValidStatus;
      }
    );

    await redis.set(
      cacheKey,
      hasValidProSubscription ? "valid" : "invalid",
      { ex: SUBSCRIPTION_CACHE_TTL }
    );

    if (!hasValidProSubscription) {
      return redirect("/tarifs");
    }

    return session;
  } catch (error: unknown) {
    console.error(
      `[Stripe API Error] Failed to fetch subscriptions for user ${session.user.id}:`,
      error
    );

    const cachedFallback = await redis.get<string>(cacheKey);
    if (cachedFallback === "valid") {
      console.log(
        `[Fallback] Using cached status for user ${session.user.id}`
      );
      return session;
    }

    throw new Error(
      "Service temporairement indisponible. Veuillez réessayer dans quelques instants."
    );
  }
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
