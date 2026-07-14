"use server";

import { getLocale } from "next-intl/server";

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
      throw new ForbiddenError("errors.billing.portalAccessForbidden");
    }

    const locale = await getLocale();

    const result = await createPortalSession({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      locale,
    });

    return result;
  });

export { createPortalSessionAction };
