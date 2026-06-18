import "server-only";

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
};

async function sendInvitationEmail(
  input: SendInvitationEmailInput,
): Promise<void> {
  const acceptLink = `${env.NEXT_PUBLIC_BASE_URL}/accepter-invitation/${input.invitationId}`;

  await sendEmailSafe({
    from: `${APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
    to: input.email,
    subject: `Invitation à rejoindre ${input.organizationName} sur ${APP_NAME}`,
    react: OrganizationInvitationEmail({
      inviterName: input.inviterName,
      inviterEmail: input.inviterEmail,
      organizationName: input.organizationName,
      role: input.role,
      acceptLink,
    }),
  });
}

export { sendInvitationEmail };
export type { SendInvitationEmailInput };
