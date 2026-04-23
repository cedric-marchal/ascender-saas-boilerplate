"use server";

import { updatePassword } from "@/features/account/services/update-password.service";
import { UpdatePasswordSchema } from "@/features/auth/schemas/password.schema";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { authActionClient } from "@/lib/safe-action";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

export const updatePasswordAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);

    return next();
  })
  .inputSchema(UpdatePasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    await updatePassword({
      currentPassword: parsedInput.currentPassword,
      newPassword: parsedInput.newPassword,
      userName: ctx.userName,
      userEmail: ctx.userEmail,
    });

    return {
      success: true,
    };
  });
