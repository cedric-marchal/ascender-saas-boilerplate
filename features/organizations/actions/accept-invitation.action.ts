"use server";

import { headers } from "next/headers";

import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { AcceptInvitationSchema } from "@/features/organizations/schemas/invitation.schema";
import { logEvent } from "@/features/organizations/services/audit-log.service";
import { checkSeatCapacity } from "@/features/organizations/services/check-seat-capacity.service";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authActionClient } from "@/lib/safe-action";

import { NotFoundError } from "@/utils/errors/errors";

const acceptInvitationAction = authActionClient
  .inputSchema(AcceptInvitationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const invitation = await prisma.invitation.findUnique({
      where: {
        id: parsedInput.id,
      },
      select: {
        organizationId: true,
        status: true,
      },
    });

    if (!invitation || invitation.status !== "pending") {
      throw new NotFoundError("errors.organizations.invitationNotFound");
    }

    // Pre-check: fast guard before the Better Auth call.
    // The authoritative race-safe gate is Better Auth's membershipLimit,
    // which counts real member rows. No counter is maintained here.
    await checkSeatCapacity(invitation.organizationId);

    await auth.api.acceptInvitation({
      body: {
        invitationId: parsedInput.id,
      },
      headers: await headers(),
    });

    await logEvent({
      organizationId: invitation.organizationId,
      userId: ctx.userId,
      action: AUDIT_ACTION.MEMBER_ACCEPTED,
      entityType: "invitation",
      entityId: parsedInput.id,
    });

    return {
      success: true,
    };
  });

export { acceptInvitationAction };
