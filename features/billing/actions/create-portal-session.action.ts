"use server";

import { createPortalSession } from "@/features/billing/services/stripe/create-portal-session.service";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { authActionClient } from "@/lib/safe-action";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

export const createPortalSessionAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);

    return next();
  })
  .action(async ({ ctx }) => {
    const result = await createPortalSession({
      userId: ctx.userId,
    });

    return result;
  });
