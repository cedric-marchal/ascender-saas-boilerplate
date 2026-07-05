"use server";

import { CreateCheckoutSessionSchema } from "@/features/billing/schemas/checkout.schema";
import { createCheckoutSession } from "@/features/billing/services/stripe/create-checkout-session.service";
import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { logEvent } from "@/features/organizations/services/audit-log.service";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const createCheckoutAction = orgActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);

    return next();
  })
  .inputSchema(CreateCheckoutSessionSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError("errors.billing.manageForbidden");
    }

    const result = await createCheckoutSession({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      priceId: parsedInput.priceId,
    });

    await logEvent({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: AUDIT_ACTION.BILLING_CHECKOUT,
      entityType: "billing",
      metadata: {
        priceId: parsedInput.priceId,
      },
    });

    return result;
  });

export { createCheckoutAction };
