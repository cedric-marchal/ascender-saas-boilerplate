"use server";

import { env } from "@/lib/env";
import { contactRatelimit } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/resend";
import { actionClient } from "@/lib/safe-action";
import { CreateContactSchema } from "@/features/contact/schemas/contact.schema";

import { ContactEmail } from "@/features/contact/emails/contact-email";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { getActionIdentifier } from "@/utils/ratelimit/get-request-identifier";

export const createContactAction = actionClient
  .use(async ({ next }) => {
    const identifier = await getActionIdentifier();
    await checkRatelimit(contactRatelimit, identifier);
    return next();
  })
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    await sendEmail({
      from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
      to: env.RESEND_EMAIL_CONTACT,
      replyTo: parsedInput.email,
      subject: `[Contact] ${parsedInput.subject}`,
      react: ContactEmail({
        name: parsedInput.name,
        email: parsedInput.email,
        subject: parsedInput.subject,
        message: parsedInput.message,
      }),
    });

    return { success: true };
  });
