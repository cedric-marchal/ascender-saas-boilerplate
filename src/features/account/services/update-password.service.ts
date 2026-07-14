import "server-only";

import { headers } from "next/headers";

import { getTranslator } from "@/i18n/get-translator";
import { getLocale } from "next-intl/server";

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

  const locale = await getLocale();
  const translate = getTranslator(locale);

  await sendEmail({
    from: `${translate("emails.common.securityFromName", { appName: env.NEXT_PUBLIC_APP_NAME })} <${env.RESEND_EMAIL_SECURITY}>`,
    to: input.userEmail,
    subject: translate("emails.passwordChanged.subject", {
      appName: env.NEXT_PUBLIC_APP_NAME,
    }),
    react: PasswordChangedEmail({
      name: input.userName,
      locale,
    }),
  });
}

export { updatePassword };

export type { UpdatePasswordInput };
