import "server-only";

import { ContactEmail } from "@/features/contact/emails/contact-email";

import { env } from "@/lib/env";
import { sendEmail } from "@/lib/resend";

type CreateContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

async function createContact(input: CreateContactInput): Promise<void> {
  await sendEmail({
    from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
    to: env.RESEND_EMAIL_CONTACT,
    replyTo: input.email,
    subject: `[Contact] ${input.subject}`,
    react: ContactEmail({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    }),
  });
}

export { createContact };

export type { CreateContactInput };
