import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/r2";
import { authenticatedRatelimit } from "@/lib/ratelimit";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/resend";
import { DeleteAccountSchema } from "@/lib/schemas/account.schema";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";

import { AccountDeletedEmail } from "@/components/emails/account-deleted-email";

import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const AVATAR_FOLDER = "avatars";

async function deleteStripeData(userId: string): Promise<void> {
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!stripeCustomer) {
    return;
  }

  await stripe.customers.del(stripeCustomer.stripeCustomerId);

  await Promise.all([
    redis.del(`subscription:${userId}:pro`),
    redis.del(`invoices:${userId}`),
  ]);
}

async function deleteUserAvatar(image: string | null): Promise<void> {
  if (!image || !image.startsWith(AVATAR_FOLDER)) {
    return;
  }

  try {
    await deleteFile(image);
  } catch (error: unknown) {
    console.error("Failed to delete user avatar:", error);
  }
}

async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    await checkRatelimit(authenticatedRatelimit, session.user.id);

    const formData = await request.formData();

    const data = DeleteAccountSchema.parse({
      confirmation: formData.get("confirmation"),
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        image: true,
        role: true,
      },
    });

    if (!user) {
      throw new BadRequestError("Utilisateur introuvable");
    }

    if (data.confirmation !== user.email) {
      throw new BadRequestError(
        "L'email de confirmation ne correspond pas à votre adresse email"
      );
    }

    if (user.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        throw new ForbiddenError(
          "Vous êtes le seul administrateur. Vous ne pouvez pas supprimer votre compte."
        );
      }
    }

    if (user.role === "CUSTOMER") {
      await deleteStripeData(user.id);
    }

    await deleteUserAvatar(user.image);

    await prisma.user.delete({ where: { id: user.id } });

    try {
      await sendEmail({
        from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
        to: user.email,
        subject: `Votre compte ${env.NEXT_PUBLIC_APP_NAME} a été supprimé`,
        react: AccountDeletedEmail({ name: session.user.name }),
      });
    } catch (emailError: unknown) {
      console.error("Failed to send account deletion email:", emailError);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { DELETE };
