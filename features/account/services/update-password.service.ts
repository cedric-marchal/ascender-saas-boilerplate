import "server-only";

import { headers } from "next/headers";

import { PasswordChangedEmail } from "@/features/auth/emails/password-changed-email";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/resend";

type UpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
  userName: string;
  userEmail: string;
};

async function updatePassword(input: UpdatePasswordInput): Promise<void> {
  await auth.api.changePassword({
    body: {
      newPassword: input.newPassword,
      currentPassword: input.currentPassword,
      revokeOtherSessions: true,
    },
    headers: await headers(),
  });

  await sendEmail({
    from: `${env.NEXT_PUBLIC_APP_NAME} Sécurité <${env.RESEND_EMAIL_SECURITY}>`,
    to: input.userEmail,
    subject: `Votre mot de passe ${env.NEXT_PUBLIC_APP_NAME} a été modifié`,
    react: PasswordChangedEmail({
      name: input.userName,
    }),
  });
}

export { updatePassword };

export type { UpdatePasswordInput };
