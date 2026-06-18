"use server";

import { headers } from "next/headers";

import { AcceptInvitationSchema } from "@/features/organizations/schemas/invitation.schema";

import { auth } from "@/lib/auth";
import { authActionClient } from "@/lib/safe-action";

export const acceptInvitationAction = authActionClient
  .inputSchema(AcceptInvitationSchema)
  .action(async ({ parsedInput }) => {
    await auth.api.acceptInvitation({
      body: {
        invitationId: parsedInput.id,
      },
      headers: await headers(),
    });

    return {
      success: true,
    };
  });
