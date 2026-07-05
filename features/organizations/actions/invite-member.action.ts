"use server";

import { headers } from "next/headers";

import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { InviteMemberSchema } from "@/features/organizations/schemas/invitation.schema";
import { logEvent } from "@/features/organizations/services/audit-log.service";
import { checkSeatCapacity } from "@/features/organizations/services/check-seat-capacity.service";

import { auth } from "@/lib/auth";
import { invitationRatelimit } from "@/lib/ratelimit";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const inviteMemberAction = orgActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(invitationRatelimit, ctx.userId);

    return next();
  })
  .inputSchema(InviteMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError(
        "Seuls les propriétaires et administrateurs peuvent inviter des membres",
      );
    }

    await checkSeatCapacity(ctx.organizationId);

    await auth.api.createInvitation({
      body: {
        email: parsedInput.email,
        role: parsedInput.role,
        organizationId: ctx.organizationId,
      },
      headers: await headers(),
    });

    await logEvent({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: AUDIT_ACTION.MEMBER_INVITED,
      entityType: "invitation",
      metadata: {
        email: parsedInput.email,
        role: parsedInput.role,
      },
    });

    return {
      success: true,
    };
  });

export { inviteMemberAction };
