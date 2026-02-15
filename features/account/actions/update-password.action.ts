"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { authenticatedRatelimit } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/resend";
import { authActionClient } from "@/lib/safe-action";
import { UpdatePasswordSchema } from "@/features/auth/schemas/password.schema";

import { PasswordChangedEmail } from "@/components/emails/password-changed-email";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

export const updatePasswordAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(authenticatedRatelimit, ctx.userId);
    return next();
  })
  .inputSchema(UpdatePasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    await auth.api.changePassword({
      body: {
        newPassword: parsedInput.newPassword,
        currentPassword: parsedInput.currentPassword,
        revokeOtherSessions: false,
      },
      headers: await headers(),
    });

    await sendEmail({
      from: `${env.NEXT_PUBLIC_APP_NAME} Sécurité <${env.RESEND_EMAIL_SECURITY}>`,
      to: ctx.userEmail,
      subject: `Votre mot de passe ${env.NEXT_PUBLIC_APP_NAME} a été modifié`,
      react: PasswordChangedEmail({ name: ctx.userName }),
    });

    return { success: true };
  });
