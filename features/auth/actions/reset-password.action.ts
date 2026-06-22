"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { ResetPasswordActionSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";

import { BadRequestError } from "@/utils/errors/errors";

const resetPasswordAction = actionClient
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
