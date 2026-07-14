"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { SignInSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/generated/prisma/client";
import { ROLE_DASHBOARD_URL } from "@/lib/navigation";
import { authSignInRatelimit } from "@/lib/ratelimit";
import { actionClient } from "@/lib/safe-action";

import { UnauthorizedError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { getActionIdentifier } from "@/utils/ratelimit/get-request-identifier";

const signInAction = actionClient
  .use(async ({ next, clientInput }) => {
    const { email } = clientInput as { email: string };
    const ip = await getActionIdentifier();
    await checkRatelimit(authSignInRatelimit, `${ip}:${email}`);

    return next();
  })
  .inputSchema(SignInSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.signInEmail({
        body: {
          email: parsedInput.email,
          password: parsedInput.password,
        },
        headers: await headers(),
      });

      const role = session.user.role as UserRole;
      const redirectUrl = ROLE_DASHBOARD_URL[role];

      return {
        success: true,
        redirectUrl,
      };
    } catch (error: unknown) {
      if (error instanceof APIError) {
        throw new UnauthorizedError(error.message);
      }

      throw error;
    }
  });

export { signInAction };
