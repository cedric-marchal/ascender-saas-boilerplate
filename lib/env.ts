import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    MAINTENANCE_ENABLED: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(false),
    BETTER_AUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    DATABASE_URL: z
      .string()
      .min(1)
      .pipe(z.url({ message: "URL de base de données invalide" })),
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    RESEND_DOMAIN: z
      .string()
      .min(1)
      .pipe(z.email({ message: "Format d'email invalide" })),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z
      .string()
      .optional()
      .default("https://placeholder.upstash.io"),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional().default("placeholder"),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_BASE_URL: z
      .string()
      .min(1)
      .pipe(z.url({ message: "URL invalide" })),
    NEXT_PUBLIC_SUPPORT_EMAIL: z
      .string()
      .min(1)
      .pipe(z.email({ message: "Format d'email invalide" })),
    NEXT_PUBLIC_R2_PUBLIC_URL: z
      .string()
      .min(1)
      .pipe(z.url({ message: "URL R2 invalide" })),
    NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE: z.coerce
      .number({
        message: "La taille maximale de fichier est de 4.5MB",
      })
      .default(4718592)
      .pipe(
        z.number({ message: "La taille maximale de fichier est de 4.5MB" })
      ),
  },
  runtimeEnv: {
    MAINTENANCE_ENABLED: process.env.MAINTENANCE_ENABLED,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_DOMAIN: process.env.RESEND_DOMAIN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE:
      process.env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE,
  },
  emptyStringAsUndefined: true,
  skipValidation: false,
});
