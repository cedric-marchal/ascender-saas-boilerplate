import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { resend } from "@/lib/resend";
import { CreateContactSchema } from "@/lib/schemas/contact.schema";

import { ContactEmail } from "@/components/emails/contact-email";

import { handleApiError } from "@/utils/api/handle-api-error";

const CONTACT_EMAIL = "contact@example.com"; // À remplacer par ton email

async function POST(request: Request) {
  try {
    // Rate limit

    const formData = await request.formData();

    const contactData = CreateContactSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    });

    await resend.emails.send({
      from: `${env.NEXT_PUBLIC_APP_NAME} <noreply@${env.RESEND_DOMAIN}>`,
      to: CONTACT_EMAIL,
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
