import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
  server: {
    NEXT_TELEMETRY_DISABLED: z.string().min(1),
    MAINTENANCE_ENABLED: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    DATABASE_URL: z
      .string()
      .min(1)
      .pipe(z.url({ message: "Invalid database URL" })),

    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),

    RESEND_API_KEY: z.string().min(1),
    RESEND_EMAIL_NOREPLY: z
      .string()
      .min(1)
      .pipe(z.email({ message: "Invalid email format for noreply" })),
    RESEND_EMAIL_CONTACT: z
      .string()
      .min(1)
      .pipe(z.email({ message: "Invalid email format for contact" })),
    RESEND_EMAIL_SECURITY: z
      .string()
      .min(1)
      .pipe(z.email({ message: "Invalid email format for security" })),

    UPSTASH_REDIS_REST_URL: z.string().min(1),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRICE_ID_PRO: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_BASE_URL: z
      .string()
      .min(1)
      .pipe(z.url({ message: "Invalid URL" })),
    NEXT_PUBLIC_R2_PUBLIC_URL: z
      .string()
      .min(1)
      .pipe(z.url({ message: "Invalid R2 URL" })),
    NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE: z.coerce
      .number({
        message: "Maximum file size is 4.5MB",
      })
      .default(4718592)
      .pipe(z.number({ message: "Maximum file size is 4.5MB" })),
  },
  runtimeEnv: {
    // Server
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,

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
    RESEND_EMAIL_NOREPLY: process.env.RESEND_EMAIL_NOREPLY,
    RESEND_EMAIL_CONTACT: process.env.RESEND_EMAIL_CONTACT,
    RESEND_EMAIL_SECURITY: process.env.RESEND_EMAIL_SECURITY,

    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO,

    // Client
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE:
      process.env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE,
  },
  emptyStringAsUndefined: true,
  skipValidation: false,
});

export { env };
