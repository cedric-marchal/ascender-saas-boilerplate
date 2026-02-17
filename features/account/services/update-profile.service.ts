import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { randomBytes } from "crypto";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

import { EmailVerificationEmail } from "@/features/auth/emails/email-verification-email";

import { BadRequestError, ConflictError } from "@/utils/errors/errors";

const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

type UpdateProfileInput = {
  userId: string;
  name: string;
  email: string;
};

type UpdateProfileResult = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
  emailChanged: boolean;
};

async function createEmailVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

  await prisma.verification.create({
    data: {
      id: randomBytes(16).toString("hex"),
      identifier: email,
      value: token,
      expiresAt,
    },
  });

  return token;
}

async function sendEmailVerification(
  name: string,
  email: string,
  token: string
): Promise<void> {
  const verificationLink = `${env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`;

  await sendEmail({
    from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
    to: email,
    subject: "Vérifiez votre adresse email",
    react: EmailVerificationEmail({
      name,
      verificationLink,
    }),
  });
}

async function updateProfile(
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const currentUser = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!currentUser) {
    throw new BadRequestError("Utilisateur introuvable");
  }

  const emailChanged = currentUser.email !== input.email;
  const nameChanged = currentUser.name !== input.name;

  if (emailChanged) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Cette adresse email est déjà utilisée");
    }
  }

  if (!emailChanged && nameChanged) {
    await auth.api.updateUser({
      body: {
        name: input.name,
      },
      headers: await headers(),
    });

    revalidatePath("/dashboard/parametres");

    return {
      user: {
        id: currentUser.id,
        name: input.name,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
      },
      emailChanged: false,
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: input.userId },
    data: {
      name: input.name,
      email: input.email,
      emailVerified: emailChanged ? false : currentUser.emailVerified,
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
    },
  });

  await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });

  if (emailChanged) {
    const verificationToken = await createEmailVerificationToken(
      updatedUser.email
    );

    await sendEmailVerification(
      updatedUser.name,
      updatedUser.email,
      verificationToken
    );
  }

  revalidatePath("/dashboard/parametres");

  return {
    user: updatedUser,
    emailChanged,
  };
}

export { updateProfile };

export type { UpdateProfileInput, UpdateProfileResult };
