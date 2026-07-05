"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { ForgotPasswordSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import { authPasswordRatelimit } from "@/lib/ratelimit";
import { actionClient } from "@/lib/safe-action";

import { BadRequestError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { getActionIdentifier } from "@/utils/ratelimit/get-request-identifier";

const forgotPasswordAction = actionClient
  .use(async ({ next, clientInput }) => {
    const { email } = clientInput as { email: string };
    const ip = await getActionIdentifier();
    await checkRatelimit(authPasswordRatelimit, `${ip}:${email}`);

    return next();
  })
  .inputSchema(ForgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.requestPasswordReset({
        body: {
          email: parsedInput.email,
          redirectTo: "/reset-password",
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

export { forgotPasswordAction };
