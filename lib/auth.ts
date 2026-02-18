import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { UserRole } from "@/lib/constants/roles.constant";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { sendEmailSafe } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

import { EmailChangeNotificationEmail } from "@/features/auth/emails/email-change-notification-email";
import { PasswordChangedEmail } from "@/features/auth/emails/password-changed-email";
import { ResetPasswordEmail } from "@/features/auth/emails/reset-password-email";
import { WelcomeEmail } from "@/features/auth/emails/welcome-email";

import { slugify } from "@/utils/string/slugify";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmailSafe({
        from: `${APP_NAME} Sécurité <${env.RESEND_EMAIL_SECURITY}>`,
        to: user.email,
        subject: `Réinitialisez votre mot de passe ${APP_NAME}`,
        react: ResetPasswordEmail({ name: user.name, resetLink: url }),
      });
    },
    onPasswordReset: async ({ user }) => {
      await sendEmailSafe({
        from: `${APP_NAME} Sécurité <${env.RESEND_EMAIL_SECURITY}>`,
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
      await sendEmailSafe({
        from: `${APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
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

      if (dbUser.role !== UserRole.CUSTOMER) {
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
    additionalFields: {
      role: {
        type: "string",
        enum: Object.values(UserRole),
        input: false,
      },
      slug: {
        type: "string",
        input: false,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        await Promise.allSettled([
          sendEmailSafe({
            from: `${APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
            to: newEmail,
            subject: `Vérifiez votre nouvelle adresse email ${APP_NAME}`,
            react: WelcomeEmail({
              name: user.name,
              verificationLink: url,
            }),
          }),
          sendEmailSafe({
            from: `${APP_NAME} Sécurité <${env.RESEND_EMAIL_SECURITY}>`,
            to: user.email,
            subject: `Modification d'adresse email demandée sur ${APP_NAME}`,
            react: EmailChangeNotificationEmail({ name: user.name }),
          }),
        ]);
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const baseSlug = slugify(user.name) || "utilisateur";
          const randomValue = crypto.getRandomValues(new Uint32Array(1))[0];
          const uniqueSuffix =
            Date.now().toString(36) + randomValue.toString(36);

          return { data: { ...user, slug: `${baseSlug}-${uniqueSuffix}` } };
        },
      },
    },
  },
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  plugins: [nextCookies()],
});

export { auth };
