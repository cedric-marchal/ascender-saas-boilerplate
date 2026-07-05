import "server-only";

import { getTranslator } from "@/i18n/get-translator";
import type { Locale } from "next-intl";

import { OrganizationInvitationEmail } from "@/features/organizations/emails/organization-invitation-email";

import { env } from "@/lib/env";
import { sendEmailSafe } from "@/lib/resend";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

type SendInvitationEmailInput = {
  invitationId: string;
  email: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  role: string;
  locale: Locale;
};

async function sendInvitationEmail(
  input: SendInvitationEmailInput,
): Promise<void> {
  const acceptLink = `${env.NEXT_PUBLIC_BASE_URL}/accepter-invitation/${input.invitationId}`;
  const translate = getTranslator(input.locale);

  await sendEmailSafe({
    from: `${translate("emails.common.noreplyFromName", { appName: APP_NAME })} <${env.RESEND_EMAIL_NOREPLY}>`,
    to: input.email,
    subject: translate("emails.organizationInvitation.subject", {
      appName: APP_NAME,
      organizationName: input.organizationName,
    }),
    react: OrganizationInvitationEmail({
      inviterName: input.inviterName,
      inviterEmail: input.inviterEmail,
      organizationName: input.organizationName,
      role: input.role,
      acceptLink,
      locale: input.locale,
    }),
  });
}

export { sendInvitationEmail };
export type { SendInvitationEmailInput };
