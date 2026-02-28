"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { ForgotPasswordSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";

import { BadRequestError } from "@/utils/errors/errors";

export const forgotPasswordAction = actionClient
  .inputSchema(ForgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.requestPasswordReset({
        body: { email: parsedInput.email, redirectTo: "/nouveau-mot-de-passe" },
        headers: await headers(),
      });
    } catch (error: unknown) {
      if (error instanceof APIError) {
        throw new BadRequestError(error.message);
      }

      throw error;
    }

    return { success: true };
  });
