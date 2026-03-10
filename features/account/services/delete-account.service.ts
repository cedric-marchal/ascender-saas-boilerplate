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

async function deleteAccount(input: DeleteAccountInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      image: true,
      role: true,
      stripeCustomer: {
        select: { stripeCustomerId: true },
      },
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

  // Primary action: delete from DB (atomic, cascades to stripeCustomer, subscription, sessions)
  await prisma.user.delete({ where: { id: user.id } });

  // Compensation: clean up external resources (best-effort, non-blocking)
  const stripeCustomerId = user.stripeCustomer?.stripeCustomerId;

  if (stripeCustomerId) {
    try {
      await stripe.customers.del(stripeCustomerId);
    } catch (error: unknown) {
      console.error("Failed to delete Stripe customer:", error);
    }

    try {
      await Promise.all([
        redis.del(`subscription:${user.id}:pro`),
        redis.del(`invoices:${user.id}`),
      ]);
    } catch (error: unknown) {
      console.error("Failed to delete Redis cache:", error);
    }
  }

  if (user.image && user.image.startsWith(AVATAR_FOLDER)) {
    try {
      await deleteFile(user.image);
    } catch (error: unknown) {
      console.error("Failed to delete user avatar:", error);
    }
  }

  try {
    await sendEmail({
      from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
      to: user.email,
      subject: `Votre compte ${env.NEXT_PUBLIC_APP_NAME} a été supprimé`,
      react: AccountDeletedEmail({ name: input.userName }),
    });
  } catch (error: unknown) {
    console.error("Failed to send account deletion email:", error);
  }
}

export { deleteAccount };

export type { DeleteAccountInput };
