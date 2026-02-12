import { NextResponse } from "next/server";

import type Stripe from "stripe";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { success: false, message: "Signature manquante" },
      { status: 400 }
    );
  }

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

    return NextResponse.json(
      { success: false, message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`Received Stripe event: ${event.type}`);
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
          where: { stripeCustomerId: customerId },
          select: { userId: true, stripeCustomerId: true },
        });

        if (!stripeCustomer) {
          if (process.env.NODE_ENV === "development") {
            console.error(
              `[Webhook Error] StripeCustomer not found for ${customerId}. Event: ${event.type}`
            );
          }
          break;
        }

        const subscriptionItem = subscription.items.data[0];
        const priceId = subscriptionItem?.price?.id;

        if (!priceId || !subscriptionItem) {
          console.error(
            `[Webhook Error] Missing priceId for subscription ${subscription.id}. Event: ${event.type}`
          );
          break;
        }

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          create: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: stripeCustomer.stripeCustomerId,
            stripePriceId: priceId,
            status: subscription.status,
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
            status: subscription.status,
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
          if (process.env.NODE_ENV === "development") {
            console.error(
              `[Webhook Error] StripeCustomer not found for ${customerId}. Event: ${event.type}`
            );
          }
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
          console.error(
            `[Webhook Error] No customer ID in invoice. Event: ${event.type}`
          );
          break;
        }

        const stripeCustomer = await prisma.stripeCustomer.findUnique({
          where: { stripeCustomerId: customerId },
          select: { userId: true },
        });

        if (!stripeCustomer) {
          console.error(
            `[Webhook Error] StripeCustomer not found for ${customerId}. Event: ${event.type}`
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
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`Error processing webhook event: ${errorMessage}`);
    return NextResponse.json({ success: true, received: true });
  }

  return NextResponse.json({ success: true, received: true });
}

export { POST };
