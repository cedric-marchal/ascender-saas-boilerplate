// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { resend } from "@/lib/resend";
import { WelcomeEmail } from "@/components/emails/welcome-email";
import { ResetPasswordEmail } from "@/components/emails/reset-password-email";
import { PasswordChangedEmail } from "@/components/emails/password-changed-email";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const FROM_EMAIL = "onboarding@resend.dev";

// `${APP_NAME} <noreply@${env.RESEND_DOMAIN}>`

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: `Réinitialisez votre mot de passe ${APP_NAME}`,
        react: ResetPasswordEmail({ name: user.name, resetLink: url }),
      });
    },
    onPasswordReset: async ({ user }) => {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: `Votre mot de passe ${APP_NAME} a été modifié`,
        react: PasswordChangedEmail({ name: user.name }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: `Vérifiez votre adresse email ${APP_NAME}`,
        react: WelcomeEmail({ name: user.name, verificationLink: url }),
      });
    },
  },
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  plugins: [nextCookies()],
});

export { auth };
