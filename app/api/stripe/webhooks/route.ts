import { NextResponse } from "next/server";

import type Stripe from "stripe";

import { env } from "@/lib/env";
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

  return NextResponse.json({ success: true, received: true });
}

export { POST };
