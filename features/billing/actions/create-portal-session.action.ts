"use server";

import { createPortalSession } from "@/features/billing/services/stripe/create-portal-session.service";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const createPortalSessionAction = orgActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);

    return next();
  })
  .action(async ({ ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError(
        "Seuls les propriétaires et administrateurs peuvent accéder au portail de facturation",
      );
    }

    const result = await createPortalSession({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
    });

    return result;
  });

export { createPortalSessionAction };
