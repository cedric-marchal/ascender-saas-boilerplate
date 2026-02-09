import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { contactRatelimit } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/resend";
import { CreateContactSchema } from "@/lib/schemas/contact.schema";

import { ContactEmail } from "@/components/emails/contact-email";

import { handleApiError } from "@/utils/errors/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { getRequestIdentifier } from "@/utils/ratelimit/get-request-identifier";

async function POST(request: Request) {
  try {
    const identifier = getRequestIdentifier(request);
    await checkRatelimit(contactRatelimit, identifier);

    const formData = await request.formData();

    const contactData = CreateContactSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    });

    await sendEmail({
      from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
      to: env.RESEND_EMAIL_CONTACT,
      replyTo: contactData.email,
      subject: `[Contact] ${contactData.subject}`,
      react: ContactEmail({
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        message: contactData.message,
      }),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
