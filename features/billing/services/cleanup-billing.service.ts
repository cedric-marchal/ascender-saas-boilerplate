import "server-only";

import {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
} from "@/lib/cache-keys";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

/**
 * Cleans up Stripe resources and billing Redis cache for a deleted organization.
 * Called after the DB deletion (best-effort, non-blocking).
 */
async function cleanupBillingForOrganization(
  stripeCustomerId: string | undefined,
  organizationId: string,
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
      redis.del(billingSubscriptionsCacheKey(organizationId)),
      redis.del(billingInvoicesCacheKey(organizationId)),
    ]);
  } catch (error: unknown) {
    console.error("Failed to delete Redis cache:", error);
  }
}

export { cleanupBillingForOrganization };
