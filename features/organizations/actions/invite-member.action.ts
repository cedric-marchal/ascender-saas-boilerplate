"use server";

import { headers } from "next/headers";

import { InviteMemberSchema } from "@/features/organizations/schemas/invitation.schema";

import { auth } from "@/lib/auth";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError } from "@/utils/errors/errors";

export const inviteMemberAction = orgActionClient
  .inputSchema(InviteMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError(
        "Seuls les propriétaires et administrateurs peuvent inviter des membres",
      );
    }

    await auth.api.createInvitation({
      body: {
        email: parsedInput.email,
        role: parsedInput.role,
        organizationId: ctx.organizationId,
      },
      headers: await headers(),
    });

    return {
      success: true,
    };
  });
