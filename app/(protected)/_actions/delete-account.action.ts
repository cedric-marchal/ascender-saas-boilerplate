"use server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/r2";
import { authenticatedRatelimit } from "@/lib/ratelimit";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/resend";
import { authActionClient } from "@/lib/safe-action";
import { DeleteAccountSchema } from "@/lib/schemas/account.schema";
import { stripe } from "@/lib/stripe";

import { AccountDeletedEmail } from "@/components/emails/account-deleted-email";

import { BadRequestError, ForbiddenError } from "@/utils/errors/errors";
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

export const deleteAccountAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);
    return next();
  })
  .inputSchema(DeleteAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
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

    if (parsedInput.confirmation !== user.email) {
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
        react: AccountDeletedEmail({ name: ctx.userName }),
      });
    } catch (emailError: unknown) {
      console.error("Failed to send account deletion email:", emailError);
    }

    return { success: true };
  });
