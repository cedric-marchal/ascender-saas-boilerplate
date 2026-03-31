"use server";

import { CreateCheckoutSessionSchema } from "@/features/billing/schemas/checkout.schema";
import { createCheckoutSession } from "@/features/billing/services/stripe/create-checkout-session.service";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { authActionClient } from "@/lib/safe-action";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

export const createCheckoutAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);

    return next();
  })
  .inputSchema(CreateCheckoutSessionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await createCheckoutSession({
      userId: ctx.userId,
      priceId: parsedInput.priceId,
    });

    return result;
  });
