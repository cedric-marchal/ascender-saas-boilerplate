import "server-only";

import type Stripe from "stripe";

import { STRIPE_TO_DB_SUBSCRIPTION_STATUS } from "@/features/billing/constants/subscription-status.constant";

import {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
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
    console.log(`Received Stripe event: ${event.type}`);
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

    await redis.set(eventKey, 1, { ex: EVENT_TTL_SECONDS });
  } catch (redisError: unknown) {
    console.error("Redis idempotency check failed:", redisError);
    // Redis indisponible → on continue sans idempotence (mieux que bloquer)
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
            userId: true,
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

        await prisma.$transaction(async (tx) => {
          const user = await tx.user.findUnique({
            where: {
              id: stripeCustomer.userId,
            },
            select: {
              id: true,
            },
          });

          if (!user) {
            return;
          }

          await tx.subscription.upsert({
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
        });

        await redis.del(billingSubscriptionsCacheKey(stripeCustomer.userId));

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Subscription synced] ${subscription.id} (${subscription.status}) for user ${stripeCustomer.userId}`,
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
            userId: true,
          },
        });

        if (!stripeCustomer) {
          console.warn(
            `StripeCustomer not found for ${customerId}. Event: ${event.type}`,
          );
          break;
        }

        await prisma.subscription.deleteMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
        });

        await redis.del(billingSubscriptionsCacheKey(stripeCustomer.userId));

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Subscription deleted] ${subscription.id} for user ${stripeCustomer.userId}`,
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
            userId: true,
          },
        });

        if (!stripeCustomer) {
          console.warn(
            `StripeCustomer not found for ${customerId}. Event: ${event.type}`,
          );
          break;
        }

        await redis.del(billingInvoicesCacheKey(stripeCustomer.userId));
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Cache invalidated] Invoices cache for user ${stripeCustomer.userId} - Event: ${event.type}`,
          );
        }

        break;
      }

      default:
        if (process.env.NODE_ENV === "development") {
          console.log(`Unhandled event type: ${event.type}`);
        }
    }
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);

    if (isTransientDbError(error)) {
      return {
        status: 503,
        body: {
          success: false,
          message: "Service temporairement indisponible",
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        received: true,
      },
    };
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
