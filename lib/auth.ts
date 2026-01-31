import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

import { PasswordChangedEmail } from "@/components/emails/password-changed-email";
import { ResetPasswordEmail } from "@/components/emails/reset-password-email";
import { WelcomeEmail } from "@/components/emails/welcome-email";

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
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 10,
        max: 5,
      },
      "/sign-up/email": {
        window: 10,
        max: 3,
      },
      "/reset-password": {
        window: 60,
        max: 3,
      },
      "/forget-password": {
        window: 60,
        max: 3,
      },
    },
    storage: "database",
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
    async afterEmailVerification(user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!dbUser) {
        console.error(`User not found: ${user.id}`);
        return;
      }

      if (dbUser.role !== "CUSTOMER") {
        return;
      }

      const existingStripeCustomer = await prisma.stripeCustomer.findUnique({
        where: { userId: dbUser.id },
        select: { stripeCustomerId: true },
      });

      if (!existingStripeCustomer) {
        return;
      }

      try {
        await stripe.customers.update(existingStripeCustomer.stripeCustomerId, {
          email: dbUser.email,
          name: dbUser.name,
        });

        console.log(
          `Stripe customer email updated for user ${user.id}: ${dbUser.email}`
        );
      } catch (error: unknown) {
        console.error(
          `Failed to update Stripe customer email for user ${user.id}:`,
          error
        );
      }
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: newEmail,
          subject: `Vérifiez votre nouvelle adresse email ${APP_NAME}`,
          react: WelcomeEmail({
            name: user.name,
            verificationLink: url,
          }),
        });
      },
    },
  },
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  plugins: [nextCookies()],
});

export { auth };
