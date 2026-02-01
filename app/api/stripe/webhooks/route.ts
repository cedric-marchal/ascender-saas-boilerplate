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
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { success: false, message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
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
          console.error(
            `[Webhook Error] StripeCustomer not found for ${customerId}. Event: ${event.type}`
          );
          break;
        }

        const subscriptionCacheKey = `subscription:${stripeCustomer.userId}:pro`;
        await redis.del(subscriptionCacheKey);
        console.log(
          `[Cache invalidated] Subscription cache for user ${stripeCustomer.userId} - Event: ${event.type}`
        );

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
        console.log(
          `[Cache invalidated] Invoices cache for user ${stripeCustomer.userId} - Event: ${event.type}`
        );

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`Error processing webhook event: ${errorMessage}`);
    return NextResponse.json(
      { success: false, message: `Processing Error: ${errorMessage}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, received: true });
}

export { POST };
