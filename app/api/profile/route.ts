import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { UpdateProfileSchema } from "@/lib/schemas/profile.schema";
import { getSession } from "@/lib/session";

import { EmailVerificationEmail } from "@/components/emails/email-verification-email";

import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";

const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

async function createEmailVerificationToken(
  userId: string,
  email: string
): Promise<string> {
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
) {
  const verificationLink = `${env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: `${env.NEXT_PUBLIC_APP_NAME} <noreply@${env.RESEND_DOMAIN}>`,
    to: email,
    subject: "Vérifiez votre adresse email",
    react: EmailVerificationEmail({
      name,
      verificationLink,
    }),
  });
}

async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const formData = await request.formData();

    const data = UpdateProfileSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    const emailChanged = currentUser.email !== data.email;
    const nameChanged = currentUser.name !== data.name;

    if (emailChanged) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictError("Cette adresse email est déjà utilisée");
      }
    }

    if (!emailChanged && nameChanged) {
      await auth.api.updateUser({
        body: {
          name: data.name,
        },
        headers: await headers(),
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            user: {
              id: currentUser.id,
              name: data.name,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
            },
            emailChanged: false,
          },
        },
        { status: 200 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        email: data.email,
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
        updatedUser.id,
        updatedUser.email
      );

      await sendEmailVerification(
        updatedUser.name,
        updatedUser.email,
        verificationToken
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: updatedUser,
          emailChanged,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { PATCH };
