import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type VerifyEmailInput = {
  token: string;
  userId: string;
};

type VerifyEmailResult =
  | { status: "invalid_token" }
  | { status: "expired" }
  | { status: "user_not_found" }
  | { status: "unauthorized" }
  | { status: "success" };

async function verifyEmail(
  input: VerifyEmailInput
): Promise<VerifyEmailResult> {
  const verification = await prisma.verification.findFirst({
    where: {
      value: input.token,
    },
    select: {
      id: true,
      identifier: true,
      expiresAt: true,
    },
  });

  if (!verification) {
    return { status: "invalid_token" };
  }

  if (new Date() > verification.expiresAt) {
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    return { status: "expired" };
  }

  const user = await prisma.user.findUnique({
    where: { email: verification.identifier },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    return { status: "user_not_found" };
  }

  if (user.id !== input.userId) {
    return { status: "unauthorized" };
  }

  await Promise.all([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
    prisma.verification.delete({
      where: { id: verification.id },
    }),
  ]);

  await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });

  return { status: "success" };
}

export { verifyEmail };

export type { VerifyEmailInput, VerifyEmailResult };
