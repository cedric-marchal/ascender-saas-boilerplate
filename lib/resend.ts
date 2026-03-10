import "server-only";

import { Resend, type CreateEmailOptions } from "resend";

import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

type SendEmailResult = Awaited<ReturnType<typeof resend.emails.send>>;

async function sendEmail(
  options: CreateEmailOptions,
): Promise<SendEmailResult> {
  const emailOptions = { ...options };

  if (process.env.NODE_ENV !== "production") {
    const originalTo = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;

    emailOptions.from = "Resend Dev <onboarding@resend.dev>";
    emailOptions.to = "delivered@resend.dev";
    emailOptions.subject = `[DEV - To: ${originalTo}] ${options.subject}`;
  }

  const result = await resend.emails.send(emailOptions);

  if (result.error) {
    console.error("[Resend Error]", {
      environment: process.env.NODE_ENV,
      name: result.error.name,
      message: result.error.message,
      subject: emailOptions.subject,
      to: emailOptions.to,
      timestamp: new Date().toISOString(),
    });
  }

  return result;
}

async function sendEmailSafe(
  options: CreateEmailOptions,
): Promise<SendEmailResult> {
  try {
    return await sendEmail(options);
  } catch (error: unknown) {
    console.error("[Resend Critical Error]", {
      error: error instanceof Error ? error.message : "Unknown error",
      subject: options.subject,
      to: options.to,
      timestamp: new Date().toISOString(),
    });

    return {
      data: null,
      error: {
        name: "application_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    } as SendEmailResult;
  }
}

export { sendEmail, sendEmailSafe };
export type { SendEmailResult };
