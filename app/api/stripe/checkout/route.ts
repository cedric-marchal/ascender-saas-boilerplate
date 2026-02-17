import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";

import { CreateCheckoutSessionSchema } from "@/features/billing/schemas/checkout.schema";
import { createCheckoutSession } from "@/features/billing/services/stripe/create-checkout-session.service";

import { UnauthorizedError } from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";

async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const formData = await request.formData();

    const data = CreateCheckoutSessionSchema.parse({
      priceId: formData.get("priceId"),
    });

    const result = await createCheckoutSession({
      userId: session.user.id,
      priceId: data.priceId,
    });

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
