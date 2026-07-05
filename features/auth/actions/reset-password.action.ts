"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { ResetPasswordActionSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import { authPasswordRatelimit } from "@/lib/ratelimit";
import { actionClient } from "@/lib/safe-action";

import { BadRequestError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { getActionIdentifier } from "@/utils/ratelimit/get-request-identifier";

const resetPasswordAction = actionClient
  .use(async ({ next }) => {
    const ip = await getActionIdentifier();
    await checkRatelimit(authPasswordRatelimit, ip);

    return next();
  })
  .inputSchema(ResetPasswordActionSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.resetPassword({
        body: {
          newPassword: parsedInput.password,
          token: parsedInput.token,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      if (error instanceof APIError) {
        throw new BadRequestError(error.message);
      }

      throw error;
    }

    return {
      success: true,
    };
  });

export { resetPasswordAction };
