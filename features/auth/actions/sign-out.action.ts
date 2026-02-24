"use server";

import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import { authActionClient } from "@/lib/safe-action";

import { BadRequestError } from "@/utils/errors/errors";

export const signOutAction = authActionClient.action(async () => {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error: unknown) {
    if (error instanceof APIError) throw new BadRequestError(error.message);
    throw error;
  }

  return { success: true };
});
