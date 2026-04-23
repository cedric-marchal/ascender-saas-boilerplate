"use server";

import { DeleteAccountSchema } from "@/features/account/schemas/account.schema";
import { deleteAccount } from "@/features/account/services/delete-account.service";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { authActionClient } from "@/lib/safe-action";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

export const deleteAccountAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);

    return next();
  })
  .inputSchema(DeleteAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    await deleteAccount({
      userId: ctx.userId,
      userName: ctx.userName,
      confirmation: parsedInput.confirmation,
    });

    return {
      success: true,
    };
  });
