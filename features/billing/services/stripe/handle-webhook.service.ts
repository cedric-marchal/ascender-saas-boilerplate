import "server-only";

import { routing } from "@/i18n/routing";
import type Stripe from "stripe";

import { STRIPE_TO_DB_SUBSCRIPTION_STATUS } from "@/features/billing/constants/subscription-status.constant";
import { reconcileSeatsOnDowngrade } from "@/features/billing/services/reconcile-seats.service";
import { sendPaymentFailedEmail } from "@/features/billing/services/send-payment-failed-email.service";
import { getSeatCapStatus } from "@/features/organizations/services/check-seat-capacity.service";

import {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
  paymentFailedEmailCacheKey,
  stripeEventIdempotencyCacheKey,
} from "@/lib/cache-keys";
import { env } from "@/lib/env";
import type { SubscriptionStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.name === "PrismaClientRustPanicError"
  );
}

const EVENT_TTL_SECONDS = 86400;

async function findOrganizationOwnerEmail(
  organizationId: string,
): Promise<string | null> {
  const ownerMember = await prisma.member.findFirst({
    where: {
      organizationId,
      role: "owner",
    },
    select: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return ownerMember?.user.email ?? null;
}

/**
 * Sends the dunning email at most once per invoice, deduped in Redis on the
 * invoice id (not the Stripe event id) — Stripe fires a fresh event id on
 * each payment retry attempt for the same invoice, so event-level
 * idempotency alone would not stop repeat emails.
 *
 * Locale: webhook processing has no request context to derive a locale
 * from (no cookies/headers, and `User` has no stored locale preference), so
 * this falls back to `routing.defaultLocale` — same fallback documented for
 * other context-free boundaries in `i18n.md`.
 */
async function sendDunningEmailOnce(
  invoiceId: string,
  organizationId: string,
): Promise<void> {
  const dedupeKey = paymentFailedEmailCacheKey(invoiceId);

  try {
    const alreadySent = await redis.get(dedupeKey);

    if (alreadySent) {
      return;
    }
  } catch (redisError: unknown) {
    console.error("Redis payment-failed dedupe check failed:", redisError);
    // Redis unavailable → continue without dedupe (better than dropping the dunning email)
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const ownerEmail = await findOrganizationOwnerEmail(organizationId);

  if (!organization || !ownerEmail) {
    console.warn(
      `Cannot send dunning email: missing organization or owner for org ${organizationId}`,
    );

    return;
  }

  await sendPaymentFailedEmail({
    email: ownerEmail,
    organizationName: organization.name,
    locale: routing.defaultLocale,
  });

  try {
    await redis.set(dedupeKey, 1, { ex: EVENT_TTL_SECONDS });
  } catch (redisError: unknown) {
    console.error("Redis payment-failed dedupe set failed:", redisError);
    // Non-fatal: dedupe key not set, a later retry of a different event id
    // for the same invoice may send a duplicate email — acceptable tradeoff.
  }
}

/**
 * Compares the organization's seat cap before/after a subscription write and
 * triggers `reconcileSeatsOnDowngrade` only when the cap actually shrank —
 * this is what distinguishes a real downgrade/cancellation from an unrelated
 * update (e.g. a renewal that keeps the same price). Reuses
 * `getSeatCapStatus`, the same helper `checkSeatCapacity` uses to enforce
 * the cap on member add, so "old" and "new" cap are computed identically to
 * how the rest of the app resolves seat caps.
 *
 * Deliberately best-effort: a reconciliation email failure must NOT fail the
 * webhook, unlike the payment-failed dunning email. Provisioning (syncing
 * the subscription row) is the event's primary, required side effect;
 * seat-limit notification is a secondary courtesy notice with no
 * destructive consequence if delayed (no member is ever removed), so it is
 * logged and swallowed rather than causing Stripe to retry an already
 * successfully-processed provisioning update.
 */
async function reconcileSeatsIfCapReduced(
  organizationId: string,
  previousSeatCap: number,
): Promise<void> {
  try {
    const { seatCap } = await getSeatCapStatus(organizationId);

    if (seatCap < previousSeatCap) {
      await reconcileSeatsOnDowngrade(organizationId);
    }
  } catch (reconciliationError: unknown) {
    console.error(
      "Seat reconciliation failed (non-fatal, provisioning already succeeded):",
      reconciliationError,
    );
  }
}

type WebhookResult = {
  status: number;
  body: { success: boolean; received?: boolean; message?: string };
};

async function handleStripeWebhook(
  body: string,
  signature: string,
): Promise<WebhookResult> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    if (process.env.NODE_ENV === "development") {
      console.error(`Webhook signature verification failed: ${errorMessage}`);
    }

    return {
      status: 400,
      body: {
        success: false,
        message: `Webhook Error: ${errorMessage}`,
      },
    };
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`Received Stripe event: ${event.type}`);
  }

  const eventKey = stripeEventIdempotencyCacheKey(event.id);

  try {
    const alreadyProcessed = await redis.get(eventKey);

    if (alreadyProcessed) {
      return {
        status: 200,
        body: {
          success: true,
          received: true,
        },
      };
    }
  } catch (redisError: unknown) {
    console.error("Redis idempotency check failed:", redisError);
    // Redis unavailable → continue without idempotence (better than blocking)
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const stripeCustomer = await prisma.stripeCustomer.findUnique({
          where: {
            stripeCustomerId: customerId,
          },
          select: {
            organizationId: true,
            stripeCustomerId: true,
          },
        });

        if (!stripeCustomer) {
          console.warn(
            `StripeCustomer not found for ${customerId}. Event: ${event.type}`,
          );
          break;
        }

        const subscriptionItem = subscription.items.data[0];
        const priceId = subscriptionItem?.price?.id;

        if (!priceId || !subscriptionItem) {
          console.warn(
            `Missing priceId for subscription ${subscription.id}. Event: ${event.type}`,
          );
          break;
        }

        const subscriptionStatus = (
          STRIPE_TO_DB_SUBSCRIPTION_STATUS as Record<
            string,
            SubscriptionStatus | undefined
          >
        )[subscription.status];

        if (!subscriptionStatus) {
          console.warn(
            `Unknown subscription status "${subscription.status}" for ${subscription.id}. Event: ${event.type}`,
          );
          break;
        }

        // Snapshot the seat cap BEFORE the write, only for "updated" — a
        // "created" event has no prior state to downgrade from.
        const previousSeatCapStatus =
          event.type === "customer.subscription.updated"
            ? await getSeatCapStatus(stripeCustomer.organizationId)
            : null;

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          create: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: stripeCustomer.stripeCustomerId,
            stripePriceId: priceId,
            status: subscriptionStatus,
            currentPeriodStart: new Date(
              subscriptionItem.current_period_start * 1000,
            ),
            currentPeriodEnd: new Date(
              subscriptionItem.current_period_end * 1000,
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          update: {
            stripePriceId: priceId,
            status: subscriptionStatus,
            currentPeriodStart: new Date(
              subscriptionItem.current_period_start * 1000,
            ),
            currentPeriodEnd: new Date(
              subscriptionItem.current_period_end * 1000,
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        await redis.del(
          billingSubscriptionsCacheKey(stripeCustomer.organizationId),
        );

        if (previousSeatCapStatus) {
          await reconcileSeatsIfCapReduced(
            stripeCustomer.organizationId,
            previousSeatCapStatus.seatCap,
          );
        }

        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[Subscription synced] ${subscription.id} (${subscription.status}) for org ${stripeCustomer.organizationId}`,
          );
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const stripeCustomer = await prisma.stripeCustomer.findUnique({
          where: {
            stripeCustomerId: customerId,
          },
          select: {
            organizationId: true,
          },
        });

        if (!stripeCustomer) {
          console.warn(
            `StripeCustomer not found for ${customerId}. Event: ${event.type}`,
          );
          break;
        }

        const previousSeatCapStatus = await getSeatCapStatus(
          stripeCustomer.organizationId,
        );

        await prisma.subscription.deleteMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
        });

        await redis.del(
          billingSubscriptionsCacheKey(stripeCustomer.organizationId),
        );

        await reconcileSeatsIfCapReduced(
          stripeCustomer.organizationId,
          previousSeatCapStatus.seatCap,
        );

        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[Subscription deleted] ${subscription.id} for org ${stripeCustomer.organizationId}`,
          );
        }

        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) {
          console.warn(`No customer ID in invoice. Event: ${event.type}`);
          break;
        }

        const stripeCustomer = await prisma.stripeCustomer.findUnique({
          where: {
            stripeCustomerId: customerId,
          },
          select: {
            organizationId: true,
          },
        });

        if (!stripeCustomer) {
          console.warn(
            `StripeCustomer not found for ${customerId}. Event: ${event.type}`,
          );
          break;
        }

        await redis.del(billingInvoicesCacheKey(stripeCustomer.organizationId));

        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[Cache invalidated] Invoices cache for org ${stripeCustomer.organizationId} - Event: ${event.type}`,
          );
        }

        if (event.type === "invoice.payment_failed") {
          await sendDunningEmailOnce(invoice.id, stripeCustomer.organizationId);
        }

        break;
      }

      default:
        if (process.env.NODE_ENV === "development") {
          console.warn(`Unhandled event type: ${event.type}`);
        }
    }
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);

    if (isTransientDbError(error)) {
      // Do NOT set the idempotency key — allow Stripe to retry
      return {
        status: 503,
        body: {
          success: false,
          message: "Service temporairement indisponible",
        },
      };
    }

    // Unexpected error: return 5xx so Stripe retries.
    // The idempotency key was never set (we moved the set to after success),
    // so Stripe will retry and the event will be reprocessed.
    return {
      status: 500,
      body: {
        success: false,
        message: "Erreur interne du serveur",
      },
    };
  }

  // Mark the event as processed ONLY after the handler succeeded.
  // This ensures a failed handler does not poison idempotency.
  try {
    await redis.set(eventKey, 1, { ex: EVENT_TTL_SECONDS });
  } catch (redisError: unknown) {
    console.error("Redis idempotency set failed:", redisError);
    // Non-fatal: idempotency key not set, event may be reprocessed.
    // Acceptable tradeoff — better than dropping a successfully-processed event.
  }

  return {
    status: 200,
    body: {
      success: true,
      received: true,
    },
  };
}

export { handleStripeWebhook };

export type { WebhookResult };
