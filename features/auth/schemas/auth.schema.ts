import {
  MAX_PASSWORD_LENGTH,
  passwordSchema,
} from "@/features/auth/schemas/password.schema";
import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "L'email est requis")
  .max(254, "L'email doit contenir moins de 254 caractères")
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Format d'email invalide" }));

const SignUpSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .trim(),
  email: emailSchema,
  password: passwordSchema,
});

const SignInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .max(
      MAX_PASSWORD_LENGTH,
      `Le nom doit contenir moins de ${MAX_PASSWORD_LENGTH} caractères`
    )
    .trim(),
});

const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

const ResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "La confirmation est requise").trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type SignUpSchemaType = z.infer<typeof SignUpSchema>;
type SignInSchemaType = z.infer<typeof SignInSchema>;
type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;

export {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SignInSchema,
  SignUpSchema,
};

export type {
  ForgotPasswordSchemaType,
  ResetPasswordSchemaType,
  SignInSchemaType,
  SignUpSchemaType,
};
