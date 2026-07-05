"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { SignUpSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import { authSignUpRatelimit } from "@/lib/ratelimit";
import { actionClient } from "@/lib/safe-action";

import { ConflictError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { getActionIdentifier } from "@/utils/ratelimit/get-request-identifier";

const signUpAction = actionClient
  .use(async ({ next, clientInput }) => {
    const { email } = clientInput as { email: string };
    const ip = await getActionIdentifier();
    await checkRatelimit(authSignUpRatelimit, `${ip}:${email}`);

    return next();
  })
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

    return {
      success: true,
    };
  });

export { signUpAction };
