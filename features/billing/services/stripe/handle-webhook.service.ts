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
  stripeSubscriptionDeletedCacheKey,
} from "@/lib/cache-keys";
import { env } from "@/lib/env";
import type { SubscriptionStatus } from "@/lib/generated/prisma/client";
import { logger } from "@/lib/logger";
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

// Must cover Stripe's out-of-order retry window (~3 days) so a delayed
// "updated" arriving after a "deleted" is still recognised as stale.
const SUBSCRIPTION_DELETED_TTL_SECONDS = 60 * 60 * 24 * 3;

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
    logger.error("Redis payment-failed dedupe check failed", {
      invoiceId,
      organizationId,
      error:
        redisError instanceof Error ? redisError.message : String(redisError),
    });
    // Redis unavailable → continue without dedupe (better than dropping the dunning email)
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const ownerEmail = await findOrganizationOwnerEmail(organizationId);

  if (!organization || !ownerEmail) {
    logger.warn("Cannot send dunning email: missing organization or owner", {
      organizationId,
      invoiceId,
    });

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
    logger.error("Redis payment-failed dedupe set failed", {
      invoiceId,
      organizationId,
      error:
        redisError instanceof Error ? redisError.message : String(redisError),
    });
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
    logger.error(
      "Seat reconciliation failed (non-fatal, provisioning already succeeded)",
      {
        organizationId,
        error:
          reconciliationError instanceof Error
            ? reconciliationError.message
            : String(reconciliationError),
      },
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

    logger.error("Webhook signature verification failed", {
      error: errorMessage,
    });

    return {
      status: 400,
      body: {
        success: false,
        message: `Webhook Error: ${errorMessage}`,
      },
    };
  }

  logger.debug("Received Stripe event", { eventType: event.type });

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
    logger.error("Redis idempotency check failed", {
      eventId: event.id,
      eventType: event.type,
      error:
        redisError instanceof Error ? redisError.message : String(redisError),
    });
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
          logger.warn("StripeCustomer not found", {
            customerId,
            eventType: event.type,
          });
          break;
        }

        const subscriptionItem = subscription.items.data[0];
        const priceId = subscriptionItem?.price?.id;

        if (!priceId || !subscriptionItem) {
          logger.warn("Missing priceId for subscription", {
            subscriptionId: subscription.id,
            eventType: event.type,
          });
          break;
        }

        const subscriptionStatus = (
          STRIPE_TO_DB_SUBSCRIPTION_STATUS as Record<
            string,
            SubscriptionStatus | undefined
          >
        )[subscription.status];

        if (!subscriptionStatus) {
          logger.warn("Unknown subscription status", {
            subscriptionId: subscription.id,
            status: subscription.status,
            eventType: event.type,
          });
          break;
        }

        // Guard against out-of-order delivery: if this subscription was already
        // removed by a newer "deleted" event, a delayed/older "created"/"updated"
        // must NOT re-create the row and silently re-grant access. Stripe does
        // not guarantee ordering and retries for up to ~3 days.
        const deletedEventCreatedAt = await redis.get(
          stripeSubscriptionDeletedCacheKey(subscription.id),
        );

        if (
          deletedEventCreatedAt !== null &&
          event.created <= Number(deletedEventCreatedAt)
        ) {
          logger.warn("Skipping stale subscription event (already deleted)", {
            subscriptionId: subscription.id,
            eventType: event.type,
            eventCreated: event.created,
            deletedEventCreatedAt: Number(deletedEventCreatedAt),
          });

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

        logger.debug("Subscription synced", {
          subscriptionId: subscription.id,
          status: subscription.status,
          organizationId: stripeCustomer.organizationId,
        });

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
          logger.warn("StripeCustomer not found", {
            customerId,
            eventType: event.type,
          });
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

        // Tombstone the deletion time so a later out-of-order "updated" for this
        // subscription cannot re-create the row and re-grant access.
        await redis.set(
          stripeSubscriptionDeletedCacheKey(subscription.id),
          event.created,
          {
            ex: SUBSCRIPTION_DELETED_TTL_SECONDS,
          },
        );

        await redis.del(
          billingSubscriptionsCacheKey(stripeCustomer.organizationId),
        );

        await reconcileSeatsIfCapReduced(
          stripeCustomer.organizationId,
          previousSeatCapStatus.seatCap,
        );

        logger.debug("Subscription deleted", {
          subscriptionId: subscription.id,
          organizationId: stripeCustomer.organizationId,
        });

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
          logger.warn("No customer ID in invoice", { eventType: event.type });
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
          logger.warn("StripeCustomer not found", {
            customerId,
            eventType: event.type,
          });
          break;
        }

        await redis.del(billingInvoicesCacheKey(stripeCustomer.organizationId));

        logger.debug("Invoices cache invalidated", {
          organizationId: stripeCustomer.organizationId,
          eventType: event.type,
        });

        if (event.type === "invoice.payment_failed") {
          await sendDunningEmailOnce(invoice.id, stripeCustomer.organizationId);
        }

        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId =
          typeof dispute.charge === "string"
            ? dispute.charge
            : dispute.charge?.id;

        if (!chargeId) {
          logger.warn("No charge on dispute", { eventType: event.type });
          break;
        }

        const charge = await stripe.charges.retrieve(chargeId);
        const customerId =
          typeof charge.customer === "string"
            ? charge.customer
            : charge.customer?.id;

        if (!customerId) {
          logger.warn("No customer on disputed charge", { chargeId });
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
          logger.warn("StripeCustomer not found", {
            customerId,
            eventType: event.type,
          });
          break;
        }

        // A chargeback is an unambiguous signal to stop access. Cancel the live
        // Stripe subscription(s); the resulting `subscription.deleted` events
        // revoke entitlement through the normal (tombstoned) path.
        const activeSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 100,
        });

        for (const activeSubscription of activeSubscriptions.data) {
          await stripe.subscriptions.cancel(activeSubscription.id);
        }

        logger.warn("Subscription cancelled due to chargeback", {
          organizationId: stripeCustomer.organizationId,
          chargeId,
          cancelledCount: activeSubscriptions.data.length,
        });

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const customerId =
          typeof charge.customer === "string"
            ? charge.customer
            : charge.customer?.id;

        // A refund does NOT cancel the subscription in Stripe, and a partial
        // refund must not revoke access. Surface it for operator review rather
        // than auto-revoking (which could cut off a legitimate subscriber).
        logger.warn(
          "Charge refunded — review whether the subscription must be canceled",
          {
            chargeId: charge.id,
            customerId: customerId ?? null,
            amountRefunded: charge.amount_refunded,
            fullyRefunded: charge.refunded,
          },
        );

        break;
      }

      default:
        logger.debug("Unhandled event type", { eventType: event.type });
    }
  } catch (error: unknown) {
    logger.error("Webhook processing error", {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : String(error),
    });

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
    logger.error("Redis idempotency set failed", {
      eventId: event.id,
      eventType: event.type,
      error:
        redisError instanceof Error ? redisError.message : String(redisError),
    });
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
