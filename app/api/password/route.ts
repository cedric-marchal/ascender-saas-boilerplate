import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { authenticatedRatelimit } from "@/lib/ratelimit";
import { resend } from "@/lib/resend";
import { UpdatePasswordSchema } from "@/lib/schemas/password.schema";
import { getSession } from "@/lib/session";

import { PasswordChangedEmail } from "@/components/emails/password-changed-email";

import {
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    await checkRatelimit(authenticatedRatelimit, session.user.id);

    const formData = await request.formData();

    const data = UpdatePasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    await auth.api.changePassword({
      body: {
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
        revokeOtherSessions: false,
      },
      headers: await headers(),
    });

    await resend.emails.send({
      from: `${env.NEXT_PUBLIC_APP_NAME} <noreply@${env.RESEND_DOMAIN}>`,
      to: session.user.email,
      subject: `Votre mot de passe ${env.NEXT_PUBLIC_APP_NAME} a été modifié`,
      react: PasswordChangedEmail({ name: session.user.name }),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { PATCH };
