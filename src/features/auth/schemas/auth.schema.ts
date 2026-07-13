import { z } from "zod";

import {
  MAX_PASSWORD_LENGTH,
  passwordSchema,
} from "@/features/auth/schemas/password.schema";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace), not literal text — see `utils/errors/translate-field-errors.ts`
 * for the display-time resolution pattern shared by every schema.
 */
const emailSchema = z
  .string()
  .min(1, "validation.email.required")
  .max(254, "validation.email.tooLong")
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "validation.email.invalid" }));

const SignUpSchema = z.object({
  name: z
    .string()
    .min(1, "validation.name.required")
    .max(100, "validation.name.tooLong")
    .trim(),
  email: emailSchema,
  password: passwordSchema,
});

const SignInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "validation.password.required")
    .max(MAX_PASSWORD_LENGTH, "validation.password.tooLongLogin")
    .trim(),
});

const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

const ResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, "validation.confirmPassword.required")
      .trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.confirmPassword.mismatch",
    path: ["confirmPassword"],
  });

const ResetPasswordActionSchema = ResetPasswordSchema.and(
  z.object({
    token: z.string().min(1, "validation.token.required").trim(),
  }),
);

type SignUpSchemaType = z.infer<typeof SignUpSchema>;
type SignInSchemaType = z.infer<typeof SignInSchema>;
type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
type ResetPasswordActionSchemaType = z.infer<typeof ResetPasswordActionSchema>;

export {
  ForgotPasswordSchema,
  ResetPasswordActionSchema,
  ResetPasswordSchema,
  SignInSchema,
  SignUpSchema,
};

export type {
  ForgotPasswordSchemaType,
  ResetPasswordActionSchemaType,
  ResetPasswordSchemaType,
  SignInSchemaType,
  SignUpSchemaType,
};
