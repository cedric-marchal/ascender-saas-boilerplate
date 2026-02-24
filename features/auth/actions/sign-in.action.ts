"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { SignInSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";

import { UnauthorizedError } from "@/utils/errors/errors";

export const signInAction = actionClient
  .inputSchema(SignInSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.signInEmail({
        body: { email: parsedInput.email, password: parsedInput.password },
        headers: await headers(),
      });
    } catch (error: unknown) {
      if (error instanceof APIError) throw new UnauthorizedError(error.message);
      throw error;
    }

    return { success: true };
  });
