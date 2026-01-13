import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { resend } from "@/lib/resend";
import { ContactSchema } from "@/lib/schemas/contact.schema";

import { ContactEmail } from "@/components/emails/contact-email";

import {
  TooManyRequestsError,
  handleApiError,
} from "@/utils/api/handle-api-error";

const CONTACT_EMAIL = "contact@example.com"; // À remplacer par ton email

async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const data = ContactSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    });

    await resend.emails.send({
      from: `${env.NEXT_PUBLIC_APP_NAME} <noreply@${env.RESEND_DOMAIN}>`,
      to: CONTACT_EMAIL,
      replyTo: data.email,
      subject: `[Contact] ${data.subject}`,
      react: ContactEmail({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      }),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
