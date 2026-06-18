"use server";

import { CreateCheckoutSessionSchema } from "@/features/billing/schemas/checkout.schema";
import { createCheckoutSession } from "@/features/billing/services/stripe/create-checkout-session.service";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

export const createCheckoutAction = orgActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);

    return next();
  })
  .inputSchema(CreateCheckoutSessionSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError(
        "Seuls les propriétaires et administrateurs peuvent gérer la facturation",
      );
    }

    const result = await createCheckoutSession({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      priceId: parsedInput.priceId,
    });

    return result;
  });
