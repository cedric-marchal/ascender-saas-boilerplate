"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { ROLE_DASHBOARD_URL } from "@/features/auth/constants/role-dashboard.constant";
import { SignInSchema } from "@/features/auth/schemas/auth.schema";

import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/generated/prisma/client";
import { actionClient } from "@/lib/safe-action";

import { UnauthorizedError } from "@/utils/errors/errors";

export const signInAction = actionClient
  .inputSchema(SignInSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.signInEmail({
        body: { email: parsedInput.email, password: parsedInput.password },
        headers: await headers(),
      });

      const role = session.user.role as UserRole;
      const redirectUrl = ROLE_DASHBOARD_URL[role];

      return { success: true, redirectUrl };
    } catch (error: unknown) {
      if (error instanceof APIError) {
        throw new UnauthorizedError(error.message);
      }

      throw error;
    }
  });
