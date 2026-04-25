import "server-only";

import {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
} from "@/lib/cache-keys";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

/**
 * Nettoie les ressources Stripe et le cache Redis billing pour un utilisateur supprimé.
 * Appelé après la suppression en base (best-effort, non-bloquant).
 */
async function cleanupBillingForUser(
  stripeCustomerId: string | undefined,
  userId: string,
): Promise<void> {
  if (!stripeCustomerId) {
    return;
  }

  try {
    await stripe.customers.del(stripeCustomerId);
  } catch (error: unknown) {
    console.error("Failed to delete Stripe customer:", error);
  }

  try {
    await Promise.all([
      redis.del(billingSubscriptionsCacheKey(userId)),
      redis.del(billingInvoicesCacheKey(userId)),
    ]);
  } catch (error: unknown) {
    console.error("Failed to delete Redis cache:", error);
  }
}

export { cleanupBillingForUser };
