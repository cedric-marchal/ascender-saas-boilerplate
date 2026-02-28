"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { SignUpSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";

import { ConflictError } from "@/utils/errors/errors";

export const signUpAction = actionClient
  .inputSchema(SignUpSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.signUpEmail({
        body: {
          email: parsedInput.email,
          password: parsedInput.password,
          name: parsedInput.name,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      if (error instanceof APIError) {
        throw new ConflictError(error.message);
      }

      throw error;
    }

    return { success: true };
  });
