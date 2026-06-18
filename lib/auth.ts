import "server-only";

import { i18n } from "@better-auth/i18n";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { EmailChangeNotificationEmail } from "@/features/auth/emails/email-change-notification-email";
import { PasswordChangedEmail } from "@/features/auth/emails/password-changed-email";
import { ResetPasswordEmail } from "@/features/auth/emails/reset-password-email";
import { WelcomeEmail } from "@/features/auth/emails/welcome-email";
import {
  ac,
  adminRole,
  memberRole,
  ownerRole,
} from "@/features/organizations/constants/organization-roles.constant";
import { createOrganization } from "@/features/organizations/services/create-organization.service";
import { sendInvitationEmail } from "@/features/organizations/services/send-invitation-email.service";

import { env } from "@/lib/env";
import { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { sendEmailSafe } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

import { slugify } from "@/utils/string/slugify";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
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
    customStorage: {
      get: async (key: string) => {
        const data = await redis.get<string>(key);

        if (!data) {
          return null;
        }

        return JSON.parse(data) as {
          key: string;
          count: number;
          lastRequest: number;
        };
      },
      set: async (
        key: string,
        value: { key: string; count: number; lastRequest: number },
      ) => {
        await redis.set(key, JSON.stringify(value), { ex: 60 });
      },
    },
  },
  emailAndPassword: {
    enabled: true,
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
    async afterEmailVerification() {},
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
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
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
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "credential"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const baseSlug = slugify(user.name) || "utilisateur";
          const randomValue = crypto.getRandomValues(new Uint32Array(1))[0]!;
          const uniqueSuffix =
            Date.now().toString(36) + randomValue.toString(36);

          return {
            data: {
              ...user,
              slug: `${baseSlug}-${uniqueSuffix}`,
            },
          };
        },
        after: async (user) => {
          const userRole = (user as { role?: string }).role;

          if (userRole !== UserRole.CUSTOMER) {
            return;
          }

          try {
            await createOrganization({
              userId: user.id,
              name: user.name,
            });
          } catch (error: unknown) {
            console.error(
              `Failed to create personal organization for user ${user.id}:`,
              error,
            );
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const firstMembership = await prisma.member.findFirst({
            where: {
              userId: session.userId,
            },
            select: {
              organizationId: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: firstMembership?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
  trustedOrigins: [env.NEXT_PUBLIC_BASE_URL],
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    organization({
      ac,
      roles: {
        owner: ownerRole,
        admin: adminRole,
        member: memberRole,
      },
      creatorRole: "owner",
      invitationExpiresIn: 48 * 60 * 60 * 1000,
      sendInvitationEmail: async (data) => {
        await sendInvitationEmail({
          invitationId: data.id,
          email: data.email,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          organizationName: data.organization.name,
          role: data.role,
        });
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization, user }) => {
          if (!user) {
            return;
          }

          const existing = await prisma.stripeCustomer.findUnique({
            where: {
              organizationId: organization.id,
            },
            select: {
              stripeCustomerId: true,
            },
          });

          if (existing) {
            return;
          }

          try {
            const stripeCustomer = await stripe.customers.create(
              {
                name: organization.name,
                metadata: {
                  organizationId: organization.id,
                },
              },
              {
                idempotencyKey: `org-stripe-customer-${organization.id}`,
              },
            );

            await prisma.stripeCustomer.create({
              data: {
                organizationId: organization.id,
                stripeCustomerId: stripeCustomer.id,
              },
            });
          } catch (error: unknown) {
            console.error(
              `Failed to create Stripe customer for organization ${organization.id}:`,
              error,
            );
          }
        },
      },
    }),
    i18n({
      defaultLocale: "fr",
      translations: {
        fr: {
          USER_NOT_FOUND: "Utilisateur non trouvé",
          FAILED_TO_CREATE_USER: "Échec de la création de l'utilisateur",
          FAILED_TO_CREATE_SESSION: "Échec de la création de la session",
          FAILED_TO_UPDATE_USER: "Échec de la mise à jour de l'utilisateur",
          FAILED_TO_GET_SESSION: "Échec de la récupération de la session",
          INVALID_PASSWORD: "Mot de passe invalide",
          INVALID_EMAIL: "Email invalide",
          INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe invalide",
          INVALID_USER: "Utilisateur invalide",
          SOCIAL_ACCOUNT_ALREADY_LINKED: "Compte social déjà lié",
          PROVIDER_NOT_FOUND: "Fournisseur non trouvé",
          INVALID_TOKEN: "Jeton invalide",
          TOKEN_EXPIRED: "Jeton expiré",
          ID_TOKEN_NOT_SUPPORTED: "id_token non supporté",
          FAILED_TO_GET_USER_INFO:
            "Échec de la récupération des informations utilisateur",
          USER_EMAIL_NOT_FOUND: "Email utilisateur non trouvé",
          EMAIL_NOT_VERIFIED: "Veuillez vérifier votre adresse email",
          PASSWORD_TOO_SHORT: "Le mot de passe est trop court",
          PASSWORD_TOO_LONG: "Le mot de passe est trop long",
          USER_ALREADY_EXISTS:
            "Cet utilisateur existe déjà. Utilisez un autre email.",
          USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
            "Cet utilisateur existe déjà. Utilisez un autre email.",
          EMAIL_CAN_NOT_BE_UPDATED: "L'email ne peut pas être mis à jour",
          CREDENTIAL_ACCOUNT_NOT_FOUND: "Compte d'identifiants non trouvé",
          SESSION_EXPIRED: "Votre session a expiré. Veuillez vous reconnecter.",
          FAILED_TO_UNLINK_LAST_ACCOUNT:
            "Vous ne pouvez pas dissocier votre dernier compte",
          ACCOUNT_NOT_FOUND: "Compte non trouvé",
          USER_ALREADY_HAS_PASSWORD: "L'utilisateur a déjà un mot de passe.",
          CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
            "Connexion bloquée. Cette demande semble être une attaque CSRF.",
          VERIFICATION_EMAIL_NOT_ENABLED:
            "La vérification par email n'est pas activée",
          EMAIL_ALREADY_VERIFIED: "Email déjà vérifié",
          EMAIL_MISMATCH: "L'email ne correspond pas",
          SESSION_NOT_FRESH: "Session non fraîche",
          LINKED_ACCOUNT_ALREADY_EXISTS: "Compte lié déjà existant",
          INVALID_ORIGIN: "Origine invalide",
          INVALID_CALLBACK_URL: "URL de rappel invalide",
          INVALID_REDIRECT_URL: "URL de redirection invalide",
          INVALID_ERROR_CALLBACK_URL: "URL de rappel d'erreur invalide",
          INVALID_NEW_USER_CALLBACK_URL:
            "URL de rappel nouvel utilisateur invalide",
          MISSING_OR_NULL_ORIGIN: "Origine manquante ou nulle",
          CALLBACK_URL_REQUIRED: "callbackURL requis",
          FAILED_TO_CREATE_VERIFICATION: "Impossible de créer la vérification",
          FIELD_NOT_ALLOWED: "Ce champ n'est pas autorisé",
          ASYNC_VALIDATION_NOT_SUPPORTED:
            "La validation asynchrone n'est pas supportée",
          VALIDATION_ERROR: "Erreur de validation",
          MISSING_FIELD: "Champ requis manquant",
          METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED:
            "La méthode POST nécessite que deferSessionRefresh soit activé",
          BODY_MUST_BE_AN_OBJECT: "Le corps de la requête doit être un objet",
          PASSWORD_ALREADY_SET: "L'utilisateur a déjà un mot de passe défini",
        },
      },
    }),
    nextCookies(),
  ],
});

export { auth };
