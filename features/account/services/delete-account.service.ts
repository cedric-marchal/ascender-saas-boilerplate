import "server-only";

import { AccountDeletedEmail } from "@/features/account/emails/account-deleted-email";

import { env } from "@/lib/env";
import { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/r2";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

import { BadRequestError, ForbiddenError } from "@/utils/errors/errors";

const AVATAR_FOLDER = "avatars";

type DeleteAccountInput = {
  userId: string;
  userName: string;
  confirmation: string;
};

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

async function deleteAccount(input: DeleteAccountInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
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

  if (input.confirmation !== user.email) {
    throw new BadRequestError(
      "L'email de confirmation ne correspond pas à votre adresse email",
    );
  }

  if (user.role === UserRole.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN },
    });

    if (adminCount <= 1) {
      throw new ForbiddenError(
        "Vous êtes le seul administrateur. Vous ne pouvez pas supprimer votre compte.",
      );
    }
  }

  if (user.role === UserRole.CUSTOMER) {
    await deleteStripeData(user.id);
  }

  await deleteUserAvatar(user.image);

  await prisma.user.delete({ where: { id: user.id } });

  try {
    await sendEmail({
      from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
      to: user.email,
      subject: `Votre compte ${env.NEXT_PUBLIC_APP_NAME} a été supprimé`,
      react: AccountDeletedEmail({ name: input.userName }),
    });
  } catch (emailError: unknown) {
    console.error("Failed to send account deletion email:", emailError);
  }
}

export { deleteAccount };

export type { DeleteAccountInput };
