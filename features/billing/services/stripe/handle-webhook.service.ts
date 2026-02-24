import "server-only";

import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";

import { ALL_SUBSCRIPTION_STATUSES } from "@/features/billing/constants/subscription-status.constant";
import type { SubscriptionStatus } from "@/lib/generated/prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

const VALID_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>(
  ALL_SUBSCRIPTION_STATUSES
);

const EVENT_TTL_SECONDS = 86400;

type WebhookResult = {
  status: number;
  body: { success: boolean; received?: boolean; message?: string };
};

async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<WebhookResult> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    if (process.env.NODE_ENV === "development") {
      console.error(`Webhook signature verification failed: ${errorMessage}`);
    }

    return {
      status: 400,
      body: { success: false, message: `Webhook Error: ${errorMessage}` },
    };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`Received Stripe event: ${event.type}`);
  }

  const eventKey = `stripe:event:${event.id}`;
  const alreadyProcessed = await redis.get(eventKey);

  if (alreadyProcessed) {
    return { status: 200, body: { success: true, received: true } };
  }

  await redis.set(eventKey, 1, { ex: EVENT_TTL_SECONDS });

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
          where: { stripeCustomerId: customerId },
          select: { userId: true, stripeCustomerId: true },
        });

        if (!stripeCustomer) {
          Sentry.captureMessage(
            `StripeCustomer not found for ${customerId}. Event: ${event.type}`,
            "warning"
          );
          break;
        }

        const subscriptionItem = subscription.items.data[0];
        const priceId = subscriptionItem?.price?.id;

        if (!priceId || !subscriptionItem) {
          Sentry.captureMessage(
            `Missing priceId for subscription ${subscription.id}. Event: ${event.type}`,
            "warning"
          );
          break;
        }

        if (!VALID_SUBSCRIPTION_STATUSES.has(subscription.status)) {
          Sentry.captureMessage(
            `Unknown subscription status "${subscription.status}" for ${subscription.id}. Event: ${event.type}`,
            "warning"
          );
          break;
        }

        const subscriptionStatus = subscription.status as SubscriptionStatus;

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          create: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: stripeCustomer.stripeCustomerId,
            stripePriceId: priceId,
            status: subscriptionStatus,
            currentPeriodStart: new Date(
              subscriptionItem.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscriptionItem.current_period_end * 1000
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          update: {
            stripePriceId: priceId,
            status: subscriptionStatus,
            currentPeriodStart: new Date(
              subscriptionItem.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscriptionItem.current_period_end * 1000
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Subscription synced] ${subscription.id} (${subscription.status}) for user ${stripeCustomer.userId}`
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
          where: { stripeCustomerId: customerId },
          select: { userId: true },
        });

        if (!stripeCustomer) {
          Sentry.captureMessage(
            `StripeCustomer not found for ${customerId}. Event: ${event.type}`,
            "warning"
          );
          break;
        }

        await prisma.subscription.deleteMany({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Subscription deleted] ${subscription.id} for user ${stripeCustomer.userId}`
          );
        }

        break;
      }

      case "invoice.created":
      case "invoice.updated":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) {
          Sentry.captureMessage(
            `No customer ID in invoice. Event: ${event.type}`,
            "warning"
          );
          break;
        }

        const stripeCustomer = await prisma.stripeCustomer.findUnique({
          where: { stripeCustomerId: customerId },
          select: { userId: true },
        });

        if (!stripeCustomer) {
          Sentry.captureMessage(
            `StripeCustomer not found for ${customerId}. Event: ${event.type}`,
            "warning"
          );
          break;
        }

        const invoicesCacheKey = `invoices:${stripeCustomer.userId}`;
        await redis.del(invoicesCacheKey);
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Cache invalidated] Invoices cache for user ${stripeCustomer.userId} - Event: ${event.type}`
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
    Sentry.captureException(error, {
      extra: { eventType: event.type, eventId: event.id },
    });
    return { status: 200, body: { success: true, received: true } };
  }

  return { status: 200, body: { success: true, received: true } };
}

export { handleStripeWebhook };

export type { WebhookResult };
