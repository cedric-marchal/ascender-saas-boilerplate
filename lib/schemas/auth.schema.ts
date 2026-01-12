import { z } from "zod";

const SignUpSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .trim(),
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(254, "L'email doit contenir moins de 254 caractères")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Format d'email invalide" })),
  password: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .max(128, "Le mot de passe doit contenir moins de 128 caractères")
    .trim()
    .refine((pwd) => /[a-z]/.test(pwd), "Au moins une lettre minuscule")
    .refine((pwd) => /[A-Z]/.test(pwd), "Au moins une lettre majuscule")
    .refine((pwd) => /[0-9]/.test(pwd), "Au moins un chiffre"),
});

const SignInSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(254, "L'email doit contenir moins de 254 caractères")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Format d'email invalide" })),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .max(128, "Le mot de passe doit contenir moins de 128 caractères")
    .trim(),
});

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(254, "L'email doit contenir moins de 254 caractères")
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Format d'email invalide" })),
});

const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Le mot de passe doit contenir au moins 12 caractères")
      .max(128, "Le mot de passe doit contenir moins de 128 caractères")
      .trim()
      .refine((pwd) => /[a-z]/.test(pwd), "Au moins une lettre minuscule")
      .refine((pwd) => /[A-Z]/.test(pwd), "Au moins une lettre majuscule")
      .refine((pwd) => /[0-9]/.test(pwd), "Au moins un chiffre"),
    confirmPassword: z
      .string()
      .min(12, "Le mot de passe doit contenir au moins 12 caractères")
      .max(128, "Le mot de passe doit contenir moins de 128 caractères")
      .trim()
      .refine((pwd) => /[a-z]/.test(pwd), "Au moins une lettre minuscule")
      .refine((pwd) => /[A-Z]/.test(pwd), "Au moins une lettre majuscule")
      .refine((pwd) => /[0-9]/.test(pwd), "Au moins un chiffre"),
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
  SignUpSchema,
  SignInSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
};

export type {
  SignUpSchemaType,
  SignInSchemaType,
  ForgotPasswordSchemaType,
  ResetPasswordSchemaType,
};
