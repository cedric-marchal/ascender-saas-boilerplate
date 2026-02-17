import { NextResponse } from "next/server";

import { handleStripeWebhook } from "@/features/billing/stripe";

async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { success: false, message: "Signature manquante" },
      { status: 400 }
    );
  }

  const result = await handleStripeWebhook(body, signature);

  return NextResponse.json(result.body, { status: result.status });
}

export { POST };
